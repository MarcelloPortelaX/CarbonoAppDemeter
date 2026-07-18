import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { PropertyCard } from '../../src/components/PropertyCard';
import { Screen } from '../../src/components/Screen';
import { usePropertyStore } from '../../src/state/propertyStore';
import { useDemeterTheme } from '../../src/theme/ThemeProvider';

export default function Passports() {
  const { theme } = useDemeterTheme();
  const properties = usePropertyStore((state) => state.properties);
  const passports = usePropertyStore((state) => state.passports);
  const available = properties.filter((property) => passports[property.id]);
  return <Screen><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}><View><Text style={[styles.eyebrow, { color: theme.brand.neon }]}>TRIAGEM</Text><Text style={[styles.title, { color: theme.colors.text }]}>Passaportes</Text><Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Dossiês preliminares com estágio, pendências e limitações</Text></View>{available.length === 0 ? <EmptyState icon="clipboard-text-outline" title="Nenhum passaporte" message="Confirme o perímetro de uma área para gerar sua triagem preliminar." /> : <View style={styles.list}>{available.map((property, index) => <PropertyCard key={property.id} property={property} index={index} onPress={() => router.push({ pathname: '/passport/[id]', params: { id: property.id } })} />)}</View>}</ScrollView></Screen>;
}

const styles = StyleSheet.create({ page: { padding: 16, paddingBottom: 28, gap: 16 }, eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, marginTop: 12 }, title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, marginTop: 4 }, subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 5 }, list: { gap: 10 } });
