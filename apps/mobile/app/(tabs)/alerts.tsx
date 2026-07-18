import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { SurfaceCard } from '../../src/components/SurfaceCard';
import { usePropertyStore } from '../../src/state/propertyStore';
import { useDemeterTheme } from '../../src/theme/ThemeProvider';

export default function Alerts() {
  const { theme } = useDemeterTheme();
  const properties = usePropertyStore((state) => state.properties);
  const pending = usePropertyStore((state) => state.outbox.length);
  const documentation = properties.filter((property) => property.status === 'documentation' || property.status === 'review');
  return <Screen><ScrollView contentContainerStyle={styles.page}><View><Text style={[styles.eyebrow, { color: theme.brand.neon }]}>ACOMPANHAMENTO</Text><Text style={[styles.title, { color: theme.colors.text }]}>Alertas</Text></View><SurfaceCard style={styles.alert}><View style={[styles.icon, { backgroundColor: `${theme.colors.warning}1F` }]}><MaterialCommunityIcons name="cloud-sync-outline" size={24} color={theme.colors.warning} /></View><View style={styles.flex}><Text style={[styles.alertTitle, { color: theme.colors.text }]}>Sincronização pendente</Text><Text style={[styles.body, { color: theme.colors.textMuted }]}>{pending ? `${pending} operações permanecem salvas no aparelho.` : 'Nenhuma operação pendente no momento.'}</Text></View></SurfaceCard>{documentation.map((property) => <SurfaceCard key={property.id} style={styles.alert}><View style={[styles.icon, { backgroundColor: `${theme.colors.warning}1F` }]}><MaterialCommunityIcons name="file-document-alert-outline" size={24} color={theme.colors.warning} /></View><View style={styles.flex}><Text style={[styles.alertTitle, { color: theme.colors.text }]}>{property.name}</Text><Text style={[styles.body, { color: theme.colors.textMuted }]}>Revisar documentos, vínculo e evidências antes da próxima análise.</Text></View></SurfaceCard>)}</ScrollView></Screen>;
}

const styles = StyleSheet.create({ page: { padding: 16, paddingBottom: 28, gap: 12 }, eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, marginTop: 12 }, title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, marginTop: 4, marginBottom: 4 }, alert: { flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }, flex: { flex: 1 }, alertTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 }, body: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 } });
