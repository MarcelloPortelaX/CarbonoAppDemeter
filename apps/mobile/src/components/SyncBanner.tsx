import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useDemeterTheme } from '../theme/ThemeProvider';

export function SyncBanner({ pending }: { pending: number }) {
  const { theme } = useDemeterTheme();
  return <View style={[styles.banner, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}><MaterialCommunityIcons name={pending ? 'cloud-sync-outline' : 'cloud-check-outline'} size={18} color={pending ? theme.colors.warning : theme.colors.success} /><Text style={[styles.text, { color: theme.colors.textMuted }]}>{pending ? `${pending} alterações salvas no aparelho` : 'Modo demonstração disponível offline'}</Text></View>;
}

const styles = StyleSheet.create({ banner: { minHeight: 40, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, text: { fontFamily: 'Inter_500Medium', fontSize: 11, flex: 1 } });
