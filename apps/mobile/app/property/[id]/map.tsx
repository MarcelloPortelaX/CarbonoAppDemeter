import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, {
  MapPressEvent,
  MapType,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { EmptyState } from '../../../src/components/EmptyState';
import { NeonButton } from '../../../src/components/NeonButton';
import { Screen } from '../../../src/components/Screen';
import { usePropertyStore } from '../../../src/state/propertyStore';
import { useDemeterTheme } from '../../../src/theme/ThemeProvider';
import { areaHectares, hasSelfIntersection, perimeterMeters } from '../../../src/utils/geo';
import { darkMapStyle } from '../../../src/utils/mapStyles';

const DEFAULT_REGION = {
  latitude: -21.2264,
  longitude: -44.9787,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};
const MAP_LOAD_TIMEOUT_MS = 12_000;

type MapLoadStatus = 'loading' | 'ready' | 'unavailable';

export default function PropertyMap() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useDemeterTheme();
  const mapRef = useRef<MapView>(null);
  const properties = usePropertyStore((state) => state.properties);
  const addBoundaryPoint = usePropertyStore((state) => state.addBoundaryPoint);
  const undoBoundaryPoint = usePropertyStore((state) => state.undoBoundaryPoint);
  const confirmBoundary = usePropertyStore((state) => state.confirmBoundary);
  const nativeMapsConfigured = Constants.expoConfig?.extra?.mapsConfigured === true;
  const canAttemptMap = nativeMapsConfigured || __DEV__;
  const [mapType, setMapType] = useState<MapType>('hybrid');
  const [mapInstance, setMapInstance] = useState(0);
  const [mapStatus, setMapStatus] = useState<MapLoadStatus>(
    canAttemptMap ? 'loading' : 'unavailable',
  );
  const property = properties.find((candidate) => candidate.id === id);
  const boundary = property?.boundary ?? [];
  const area = boundary.length ? areaHectares(boundary) : property?.areaHa ?? 0;
  const perimeter = boundary.length ? perimeterMeters(boundary) / 1_000 : 0;
  const selfIntersecting = hasSelfIntersection(boundary);
  const canConfirm = boundary.length >= 3 && !selfIntersecting;
  const initialRegion = boundary[0]
    ? { ...boundary[0], latitudeDelta: 0.035, longitudeDelta: 0.035 }
    : DEFAULT_REGION;

  useEffect(() => {
    if (mapStatus !== 'loading') return undefined;

    const timeout = setTimeout(() => {
      setMapStatus('unavailable');
    }, MAP_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [mapInstance, mapStatus]);

  const handleMapPress = (event: MapPressEvent) => {
    if (property) {
      addBoundaryPoint(property.id, event.nativeEvent.coordinate);
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
      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        },
        400,
      );
    } catch {
      Alert.alert(
        'Localização indisponível',
        'Não foi possível obter sua posição agora. Continue delimitando a área manualmente.',
      );
    }
  };

  const retryMap = () => {
    if (!canAttemptMap) return;
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
        <MapView
          key={mapInstance}
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          mapType={mapType}
          customMapStyle={theme.mode === 'dark' ? darkMapStyle : []}
          initialRegion={initialRegion}
          loadingEnabled
          onMapLoaded={() => setMapStatus('ready')}
          onPress={handleMapPress}
          accessibilityLabel="Mapa para delimitar a propriedade"
        >
          {boundary.length >= 2 && (
            <Polygon
              coordinates={boundary}
              strokeColor={theme.brand.neon}
              fillColor={`${theme.brand.neon}22`}
              strokeWidth={4}
            />
          )}
          {boundary.map((point, index) => (
            <Marker
              key={`${point.latitude}-${point.longitude}-${index}`}
              coordinate={point}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.vertex,
                  { borderColor: theme.brand.neon, backgroundColor: theme.colors.surface },
                ]}
              />
            </Marker>
          ))}
        </MapView>

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
            icon="image-outline"
            label="Satélite"
            active={mapType === 'hybrid'}
            onPress={() => setMapType('hybrid')}
          />
          <Chip
            icon="map-outline"
            label="Mapa"
            active={mapType === 'standard'}
            onPress={() => setMapType('standard')}
          />
        </View>

        <MapStatusBanner
          status={mapStatus}
          configured={canAttemptMap}
          onRetry={retryMap}
        />

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
  configured: boolean;
  onRetry: () => void;
}

function MapStatusBanner({ status, configured, onRetry }: MapStatusBannerProps) {
  const { theme } = useDemeterTheme();

  if (status === 'ready') return null;

  const isLoading = status === 'loading';
  const message = configured
    ? 'Os tiles não carregaram. Verifique sua conexão e tente novamente.'
    : 'O provedor de mapa não foi configurado nesta versão do aplicativo.';

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
      {!isLoading && configured && (
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
  vertex: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
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
