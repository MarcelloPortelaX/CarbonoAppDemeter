import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDemeterTheme } from '../theme/ThemeProvider';
import { SurfaceCard } from './SurfaceCard';

export function EmptyState({ icon = 'map-marker-plus-outline', title, message, actionLabel, onAction }: { icon?: keyof typeof MaterialCommunityIcons.glyphMap; title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  const { theme } = useDemeterTheme();
  return <SurfaceCard style={styles.card}><View style={[styles.icon, { backgroundColor: `${theme.brand.neon}1A` }]}><MaterialCommunityIcons name={icon} size={28} color={theme.brand.neon} /></View><Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text><Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>{actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={[styles.action, { borderColor: theme.brand.neon }]}><Text style={[styles.actionText, { color: theme.brand.neon }]}>{actionLabel}</Text></Pressable> : null}</SurfaceCard>;
}

const styles = StyleSheet.create({ card: { alignItems: 'center', paddingVertical: 28 }, icon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, title: { fontFamily: 'Inter_700Bold', fontSize: 16 }, message: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, maxWidth: 280 }, action: { minHeight: 44, borderRadius: 999, borderWidth: 1, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, actionText: { fontFamily: 'Inter_700Bold', fontSize: 13 } });
