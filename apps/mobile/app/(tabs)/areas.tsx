import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NeonButton } from '../../src/components/NeonButton';
import { PropertyCard } from '../../src/components/PropertyCard';
import { Screen } from '../../src/components/Screen';
import { SyncBanner } from '../../src/components/SyncBanner';
import { usePropertyStore } from '../../src/state/propertyStore';
import { useDemeterTheme } from '../../src/theme/ThemeProvider';

export default function Areas() {
  const { theme } = useDemeterTheme();
  const properties = usePropertyStore((state) => state.properties);
  const pending = usePropertyStore((state) => state.outbox.length);
  const createProperty = usePropertyStore((state) => state.createProperty);
  const startProperty = () => {
    const id = createProperty();
    router.push({ pathname: '/property/[id]/map', params: { id } });
  };
  return <Screen><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}><View><Text style={[styles.eyebrow, { color: theme.brand.neon }]}>PORTFÓLIO</Text><Text style={[styles.title, { color: theme.colors.text }]}>Áreas</Text><Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{properties.length} propriedades em preparação técnica</Text></View><SyncBanner pending={pending} /><NeonButton label="Cadastrar nova área" onPress={startProperty} /><View style={styles.list}>{properties.map((property, index) => <PropertyCard key={property.id} property={property} index={index} onPress={() => router.push({ pathname: '/property/[id]/map', params: { id: property.id } })} />)}</View></ScrollView></Screen>;
}

const styles = StyleSheet.create({ page: { padding: 16, paddingBottom: 28, gap: 12 }, eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, marginTop: 12 }, title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, marginTop: 4 }, subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 5 }, list: { gap: 10 } });
