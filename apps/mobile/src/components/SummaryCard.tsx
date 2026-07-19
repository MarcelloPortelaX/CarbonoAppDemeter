import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { PropertySummary } from '../domain/models';
import { useDemeterTheme } from '../theme/ThemeProvider';
import { BrandGlyph } from './BrandGlyph';
import { MiniLineChart } from './MiniLineChart';
import { SurfaceCard } from './SurfaceCard';

function Metric({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  const { theme } = useDemeterTheme();
  return (
    <View style={styles.metric} accessibilityLabel={`${label}: ${value}`}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.brand.neon} />
      <Text style={[styles.metricLabel, { color: theme.colors.onStrong, opacity: 0.76 }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.onStrong }]}>{value}</Text>
    </View>
  );
}

export function SummaryCard({ properties, pendingOperations }: { properties: PropertySummary[]; pendingOperations: number }) {
  const { theme } = useDemeterTheme();
  const area = properties.reduce((sum, property) => sum + property.areaHa, 0);
  const pending = properties.filter((property) => property.status === 'documentation' || property.status === 'review').length + pendingOperations;
  return (
    <SurfaceCard strong style={[styles.card, theme.mode === 'dark' && { shadowColor: theme.brand.neon, shadowOpacity: 0.12 }]}>
      <View style={styles.top}>
        <Text style={[styles.kicker, { color: theme.colors.onStrong }]}>Resumo geral</Text>
        <View style={[styles.period, { borderColor: theme.colors.borderStrong }]}><Text style={[styles.periodText, { color: theme.colors.onStrong }]}>Este mês</Text><MaterialCommunityIcons name="chevron-down" size={15} color={theme.colors.onStrong} /></View>
      </View>
      <View style={styles.metrics}>
        <Metric icon="map-marker-radius-outline" label="Área analisada" value={`${Math.round(area).toLocaleString('pt-BR')} ha`} />
        <Metric icon="briefcase-outline" label="Projetos" value={String(properties.length)} />
        <Metric icon="clipboard-alert-outline" label="Pendências" value={String(pending)} />
      </View>
      <View style={styles.bottom}><View><MiniLineChart /><Text style={[styles.delta, { color: theme.brand.neon }]}>Dados demonstrativos</Text></View><BrandGlyph size={88} glow /></View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 16, overflow: 'hidden', minHeight: 250 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  period: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', gap: 4, alignItems: 'center' },
  periodText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  metrics: { flexDirection: 'row' },
  metric: { flex: 1, gap: 5, paddingRight: 8, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(255,255,255,0.18)' },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  delta: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: -4 },
});
