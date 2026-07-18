import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDemeterTheme } from '../theme/ThemeProvider';

export function NeonButton({ label, onPress, icon = 'plus', compact = false }: { label: string; onPress: () => void; icon?: keyof typeof MaterialCommunityIcons.glyphMap; compact?: boolean }) {
  const { theme } = useDemeterTheme();
  return (
    <View style={[styles.halo, theme.mode === 'dark' && { shadowColor: theme.brand.neon, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 }]}> 
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}>
        <LinearGradient colors={[theme.brand.neon, theme.brand.neonStrong]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.button, { borderColor: theme.colors.borderStrong }, compact && styles.compact]}>
          <MaterialCommunityIcons name={icon} size={21} color={theme.colors.onNeon} />
          <Text style={[styles.label, { color: theme.colors.onNeon }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { borderRadius: 999 },
  button: { minHeight: 48, borderRadius: 999, borderWidth: 1.25, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 18 },
  compact: { minHeight: 44 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});
