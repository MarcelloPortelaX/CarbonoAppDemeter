import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type LngLatBounds,
  type PressEvent,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson';
import {
  ActivityIndicator,
  Alert,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../../../src/components/EmptyState';
import { NeonButton } from '../../../src/components/NeonButton';
import { Screen } from '../../../src/components/Screen';
import { usePropertyStore } from '../../../src/state/propertyStore';
import { useDemeterTheme } from '../../../src/theme/ThemeProvider';
import { areaHectares, hasSelfIntersection, perimeterMeters } from '../../../src/utils/geo';

const DEFAULT_REGION = {
  latitude: -21.2264,
  longitude: -44.9787,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};
const MAP_LOAD_TIMEOUT_MS = 12_000;
const MAP_STYLES = {
  streets: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

type MapLoadStatus = 'loading' | 'ready' | 'unavailable';
type MapStyle = keyof typeof MAP_STYLES;

function regionToZoom(longitudeDelta: number) {
  return Math.max(2, Math.min(20, Math.log2(360 / Math.max(longitudeDelta, 0.00001))));
}

function getBoundaryBounds(boundary: { latitude: number; longitude: number }[]): LngLatBounds {
  const longitudes = boundary.map((point) => point.longitude);
  const latitudes = boundary.map((point) => point.latitude);
  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ];
}

function createBoundaryGeoJson(
  boundary: { latitude: number; longitude: number }[],
): FeatureCollection<Polygon | LineString | Point> {
  const coordinates = boundary.map((point) => [point.longitude, point.latitude] as [number, number]);
  const features: FeatureCollection<Polygon | LineString | Point>['features'] = [];

  if (coordinates.length >= 3) {
    features.push({
      type: 'Feature',
      properties: { kind: 'polygon' },
      geometry: { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]!]] },
    });
  }

  if (coordinates.length >= 2) {
    features.push({
      type: 'Feature',
      properties: { kind: 'line' },
      geometry: {
        type: 'LineString',
        coordinates: coordinates.length >= 3 ? [...coordinates, coordinates[0]!] : coordinates,
      },
    });
  }

  coordinates.forEach((coordinate, index) => {
    features.push({
      type: 'Feature',
      properties: { kind: 'vertex', index },
      geometry: { type: 'Point', coordinates: coordinate },
    });
  });

  return { type: 'FeatureCollection', features };
}

export default function PropertyMap() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useDemeterTheme();
  const cameraRef = useRef<CameraRef>(null);
  const properties = usePropertyStore((state) => state.properties);
  const addBoundaryPoint = usePropertyStore((state) => state.addBoundaryPoint);
  const undoBoundaryPoint = usePropertyStore((state) => state.undoBoundaryPoint);
  const confirmBoundary = usePropertyStore((state) => state.confirmBoundary);
  const updateMapViewport = usePropertyStore((state) => state.updateMapViewport);
  const [mapStyle, setMapStyle] = useState<MapStyle>(theme.mode === 'dark' ? 'dark' : 'streets');
  const [mapInstance, setMapInstance] = useState(0);
  const [mapStatus, setMapStatus] = useState<MapLoadStatus>('loading');
  const property = properties.find((candidate) => candidate.id === id);
  const boundary = property?.boundary ?? [];
  const area = boundary.length ? areaHectares(boundary) : property?.areaHa ?? 0;
  const perimeter = boundary.length ? perimeterMeters(boundary) / 1_000 : 0;
  const selfIntersecting = hasSelfIntersection(boundary);
  const canConfirm = boundary.length >= 3 && !selfIntersecting;
  const initialRegion = property?.mapViewport ??
    (boundary[0]
      ? { ...boundary[0], latitudeDelta: 0.035, longitudeDelta: 0.035 }
      : DEFAULT_REGION);
  const boundaryGeoJson = createBoundaryGeoJson(boundary);

  useEffect(() => {
    if (mapStatus !== 'loading') return undefined;

    const timeout = setTimeout(() => {
      setMapStatus('unavailable');
    }, MAP_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [mapInstance, mapStatus]);

  const handleMapPress = (event: NativeSyntheticEvent<PressEvent>) => {
    if (property) {
      const [longitude, latitude] = event.nativeEvent.lngLat;
      addBoundaryPoint(property.id, { latitude, longitude });
    }
  };

  const handleRegionChangeComplete = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    if (property) {
      const [longitude, latitude] = event.nativeEvent.center;
      const [west, south, east, north] = event.nativeEvent.bounds;
      updateMapViewport(property.id, {
        latitude,
        longitude,
        latitudeDelta: Math.abs(north - south),
        longitudeDelta: Math.abs(east - west),
      });
    }
  };

  const fitBoundary = (animated = true) => {
    if (boundary.length < 2) return;

    cameraRef.current?.fitBounds(getBoundaryBounds(boundary), {
      padding: { top: 120, right: 80, bottom: 320, left: 80 },
      duration: animated ? 400 : 0,
    });
  };

  const handleMapLoaded = () => {
    setMapStatus('ready');
    if (!property?.mapViewport && boundary.length >= 2) {
      requestAnimationFrame(() => fitBoundary(false));
    }
  };

  const locateUser = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Localização não autorizada',
          'Você ainda pode delimitar a área tocando no mapa.',
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      cameraRef.current?.easeTo({
        center: [location.coords.longitude, location.coords.latitude],
        zoom: 15,
        duration: 400,
      });
    } catch {
      Alert.alert(
        'Localização indisponível',
        'Não foi possível obter sua posição agora. Continue delimitando a área manualmente.',
      );
    }
  };

  const retryMap = () => {
    setMapStatus('loading');
    setMapInstance((current) => current + 1);
  };

  const confirm = () => {
    if (!property) return;

    if (boundary.length < 3) {
      Alert.alert('Perímetro incompleto', 'Marque pelo menos três vértices no mapa.');
      return;
    }

    if (selfIntersecting) {
      Alert.alert(
        'Perímetro inválido',
        'As linhas do polígono se cruzam. Desfaça o último ponto e revise o desenho.',
      );
      return;
    }

    confirmBoundary(property.id);
    router.replace({ pathname: '/property/[id]/assessment', params: { id: property.id } });
  };

  if (!property) {
    return (
      <Screen style={styles.missing}>
        <EmptyState
          icon="map-marker-off-outline"
          title="Área indisponível"
          message="Esta área não existe mais neste aparelho."
          actionLabel="Voltar às áreas"
          onAction={() => router.replace('/areas')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.hit}
        >
          <MaterialCommunityIcons name="arrow-left" size={25} color={theme.colors.icon} />
        </Pressable>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            {property.name}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {property.municipality}, {property.state}
          </Text>
        </View>
        <View style={styles.hit} />
      </View>

      <View style={styles.mapWrap}>
        <Map
          key={mapInstance}
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLES[mapStyle]}
          androidView="texture"
          attribution
          attributionPosition={{ bottom: 310, left: 8 }}
          logo={false}
          compass
          compassPosition={{ top: 76, right: 16 }}
          onWillStartLoadingMap={() => setMapStatus('loading')}
          onDidFinishLoadingMap={handleMapLoaded}
          onDidFailLoadingMap={() => setMapStatus('unavailable')}
          onPress={handleMapPress}
          onRegionDidChange={handleRegionChangeComplete}
          accessibilityLabel="Mapa para delimitar a propriedade"
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: [initialRegion.longitude, initialRegion.latitude],
              zoom: regionToZoom(initialRegion.longitudeDelta),
            }}
          />
          <GeoJSONSource id="property-boundary" data={boundaryGeoJson}>
            <Layer
              id="property-boundary-fill"
              type="fill"
              filter={['==', ['get', 'kind'], 'polygon']}
              paint={{
                'fill-color': theme.brand.neon,
                'fill-opacity': 0.16,
              }}
            />
            <Layer
              id="property-boundary-line"
              type="line"
              filter={['==', ['get', 'kind'], 'line']}
              paint={{
                'line-color': theme.brand.neon,
                'line-width': 4,
              }}
            />
            <Layer
              id="property-boundary-vertices"
              type="circle"
              filter={['==', ['get', 'kind'], 'vertex']}
              paint={{
                'circle-color': theme.colors.surface,
                'circle-radius': 7,
                'circle-stroke-color': theme.brand.neon,
                'circle-stroke-width': 3,
              }}
            />
          </GeoJSONSource>
        </Map>

        {theme.mode === 'dark' && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.scrim, opacity: 0.2 },
            ]}
          />
        )}

        <View style={styles.chips}>
          <Chip
            icon="map-outline"
            label="Ruas"
            active={mapStyle === 'streets'}
            onPress={() => setMapStyle('streets')}
          />
          <Chip
            icon="weather-night"
            label="Escuro"
            active={mapStyle === 'dark'}
            onPress={() => setMapStyle('dark')}
          />
        </View>

        <MapStatusBanner status={mapStatus} onRetry={retryMap} />

        <View style={styles.controls}>
          <MapControl
            icon="crosshairs-gps"
            label="Usar minha localização"
            onPress={locateUser}
          />
          <MapControl
            icon="plus"
            label="Adicionar vértice"
            onPress={() => Alert.alert('Adicionar vértice', 'Toque no ponto desejado do mapa.')}
          />
          <MapControl
            icon="undo-variant"
            label="Desfazer último vértice"
            disabled={!boundary.length}
            onPress={() => undoBoundaryPoint(property.id)}
          />
          <MapControl
            icon="fit-to-page-outline"
            label="Enquadrar perímetro"
            disabled={boundary.length < 2}
            onPress={() => fitBoundary()}
          />
        </View>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.mapSheet,
              borderColor: selfIntersecting ? theme.colors.danger : theme.colors.border,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          <View>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Delimitar área</Text>
            <Text
              style={[
                styles.sheetHint,
                { color: selfIntersecting ? theme.colors.danger : theme.colors.textMuted },
              ]}
            >
              {selfIntersecting
                ? 'Perímetro com cruzamento. Revise os vértices.'
                : 'Toque no mapa para adicionar vértices.'}
            </Text>
          </View>

          <View style={[styles.metrics, { borderColor: theme.colors.border }]}>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Área</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha
              </Text>
            </View>
            <View
              style={[
                styles.metric,
                styles.metricDivider,
                { borderLeftColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Perímetro</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {perimeter.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km
              </Text>
            </View>
          </View>

          <View style={[styles.vertexRow, { borderColor: theme.colors.border }]}>
            <View>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Vértices</Text>
              <Text style={[styles.vertexCount, { color: theme.colors.text }]}>
                {boundary.length} pontos
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Desfazer último ponto"
              accessibilityRole="button"
              disabled={!boundary.length}
              onPress={() => undoBoundaryPoint(property.id)}
              style={[
                styles.edit,
                { borderColor: theme.colors.border, opacity: boundary.length ? 1 : 0.45 },
              ]}
            >
              <MaterialCommunityIcons name="undo-variant" size={17} color={theme.colors.icon} />
              <Text style={[styles.editText, { color: theme.colors.text }]}>Desfazer</Text>
            </Pressable>
          </View>

          <View style={!canConfirm && styles.disabled}>
            <NeonButton
              label="Confirmar perímetro"
              icon="check-circle-outline"
              onPress={confirm}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

interface MapStatusBannerProps {
  status: MapLoadStatus;
  onRetry: () => void;
}

function MapStatusBanner({ status, onRetry }: MapStatusBannerProps) {
  const { theme } = useDemeterTheme();

  if (status === 'ready') return null;

  const isLoading = status === 'loading';
  const message = 'O mapa não carregou. Verifique sua conexão e tente novamente.';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.mapStatus,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.brand.neon} />
      ) : (
        <MaterialCommunityIcons
          name="map-marker-alert-outline"
          size={20}
          color={theme.colors.warning}
        />
      )}
      <Text style={[styles.mapStatusText, { color: theme.colors.text }]}>
        {isLoading ? 'Carregando mapa…' : message}
      </Text>
      {!isLoading && (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: theme.brand.neon }]}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}

interface ChipProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ icon, label, active, onPress }: ChipProps) {
  const { theme } = useDemeterTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.success : theme.colors.surface,
          borderColor: active ? theme.brand.neon : theme.colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={active ? theme.colors.onNeon : theme.colors.icon}
      />
      <Text
        style={[styles.chipText, { color: active ? theme.colors.onNeon : theme.colors.text }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface MapControlProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}

function MapControl({ icon, label, onPress, disabled = false }: MapControlProps) {
  const { theme } = useDemeterTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.control,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={theme.colors.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  missing: {
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 3,
  },
  hit: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  mapWrap: {
    flex: 1,
  },
  chips: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  mapStatus: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 76,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapStatusText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 15,
  },
  retryButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  retryText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  controls: {
    position: 'absolute',
    right: 16,
    top: '27%',
    gap: 10,
  },
  control: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '38%',
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 22,
    gap: 11,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    opacity: 0.45,
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
  },
  sheetHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 3,
  },
  metrics: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
  },
  metric: {
    flex: 1,
  },
  metricDivider: {
    borderLeftWidth: 1,
    paddingLeft: 18,
  },
  metricLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  metricValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginTop: 5,
  },
  vertexRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vertexCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginTop: 3,
  },
  edit: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  disabled: {
    opacity: 0.55,
  },
});
