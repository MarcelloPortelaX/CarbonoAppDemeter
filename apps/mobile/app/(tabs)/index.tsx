import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppHeader } from '../../src/components/AppHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { NeonButton } from '../../src/components/NeonButton';
import { PropertyCard } from '../../src/components/PropertyCard';
import { Screen } from '../../src/components/Screen';
import { SectionHeader } from '../../src/components/SectionHeader';
import { SummaryCard } from '../../src/components/SummaryCard';
import { SyncBanner } from '../../src/components/SyncBanner';
import { usePropertyStore } from '../../src/state/propertyStore';
import { useDemeterTheme } from '../../src/theme/ThemeProvider';

export default function Home() {
  const { theme } = useDemeterTheme();
  const properties = usePropertyStore((state) => state.properties);
  const pendingOperations = usePropertyStore((state) => state.outbox.length);
  const passports = usePropertyStore((state) => state.passports);
  const hydrated = usePropertyStore((state) => state.hydrated);
  const createProperty = usePropertyStore((state) => state.createPropertyDraft);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [filterPending, setFilterPending] = useState(false);

  const visibleProperties = useMemo(() => properties.filter((property) => {
    const matchesQuery = `${property.name} ${property.municipality} ${property.state}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'));
    const matchesFilter = !filterPending || property.status === 'documentation' || property.status === 'review';
    return matchesQuery && matchesFilter;
  }), [filterPending, properties, query]);

  const startProperty = () => {
    const id = createProperty();
    router.push({ pathname: '/property/[id]/map', params: { id } });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader />
        <SyncBanner pending={pendingOperations} />
        <SummaryCard properties={properties} pendingOperations={pendingOperations} />
        <SectionHeader title="Minhas áreas" onSearch={() => setSearchVisible((value) => !value)} onFilter={() => setFilterPending((value) => !value)} filterActive={filterPending} />
        {searchVisible && <TextInput accessibilityLabel="Buscar por nome ou município" autoFocus value={query} onChangeText={setQuery} placeholder="Buscar por nome ou município" placeholderTextColor={theme.colors.textMuted} style={[styles.search, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} />}
        <NeonButton label="Nova área" onPress={startProperty} />
        {!hydrated ? <ActivityIndicator size="large" color={theme.brand.neon} style={styles.loader} /> : visibleProperties.length === 0 ? <EmptyState title="Nenhuma área encontrada" message="Ajuste a busca ou cadastre uma nova área para iniciar a triagem." /> : <View style={styles.list}>{visibleProperties.map((property, index) => <PropertyCard key={property.id} property={property} index={index} onPress={() => router.push({ pathname: passports[property.id] ? '/passport/[id]' : '/property/[id]/map', params: { id: property.id } })} />)}</View>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 14 },
  loader: { marginVertical: 36 },
  list: { gap: 10 },
});
