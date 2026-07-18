import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDemeterTheme } from '../theme/ThemeProvider';

export function SectionHeader({ title, onSearch, onFilter, filterActive = false }: { title: string; onSearch?: () => void; onFilter?: () => void; filterActive?: boolean }) {
  const { theme } = useDemeterTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityLabel="Buscar áreas" onPress={onSearch} style={styles.hit}><MaterialCommunityIcons name="magnify" size={25} color={theme.colors.icon} /></Pressable>
        <Pressable accessibilityLabel="Filtrar áreas" accessibilityState={{ selected: filterActive }} onPress={onFilter} style={[styles.hit, filterActive && { backgroundColor: `${theme.brand.neon}1F` }]}><MaterialCommunityIcons name="tune-variant" size={23} color={filterActive ? theme.brand.neon : theme.colors.icon} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontFamily: 'Inter_700Bold', fontSize: 20 }, actions: { flexDirection: 'row', gap: 3 }, hit: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' } });
