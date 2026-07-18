import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandGlyph } from './BrandGlyph';
import { useDemeterTheme } from '../theme/ThemeProvider';

export function AppHeader() {
  const { theme } = useDemeterTheme();
  return (
    <View style={styles.row}>
      <View style={styles.brand}><BrandGlyph size={46} glow /><Text style={[styles.title, { color: theme.colors.text }]}>Demeter{`\n`}Carbono</Text></View>
      <Pressable accessibilityLabel="Abrir alertas" onPress={() => router.push('/alerts')} style={[styles.iconButton, { borderColor: theme.colors.border }]}>
        <MaterialCommunityIcons name="bell-outline" size={23} color={theme.colors.icon} />
        <View style={[styles.dot, { backgroundColor: theme.brand.neon, borderColor: theme.colors.background }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 62 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 19 },
  iconButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', right: 9, top: 8, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
});
