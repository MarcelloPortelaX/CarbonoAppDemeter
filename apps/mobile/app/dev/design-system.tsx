import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandGlyph } from '../../src/components/BrandGlyph';
import { NeonButton } from '../../src/components/NeonButton';
import { Screen } from '../../src/components/Screen';
import { StatusPill } from '../../src/components/StatusPill';
import { SurfaceCard } from '../../src/components/SurfaceCard';
import { useDemeterTheme } from '../../src/theme/ThemeProvider';

export default function DesignSystem() {
  const { theme } = useDemeterTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.hit}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.icon} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>Sistema visual</Text>
        </View>
        <SurfaceCard strong style={styles.brandCard}><BrandGlyph size={92} glow /><View style={styles.flex}><Text style={[styles.brandTitle, { color: theme.colors.onStrong }]}>Demeter Carbono</Text><Text style={[styles.copy, { color: theme.colors.onStrong, opacity: 0.72 }]}>Floresta profunda, superfícies precisas e verde neon como acento.</Text></View></SurfaceCard>
        <SurfaceCard><Text style={[styles.section, { color: theme.colors.text }]}>Estados</Text><View style={styles.wrap}><StatusPill status="analysis" /><StatusPill status="documentation" /><StatusPill status="eligible" /><StatusPill status="review" /></View></SurfaceCard>
        <SurfaceCard><Text style={[styles.section, { color: theme.colors.text }]}>Ação primária</Text><NeonButton label="Cadastrar nova área" onPress={() => undefined} /></SurfaceCard>
        <SurfaceCard><Text style={[styles.section, { color: theme.colors.text }]}>Paleta</Text><View style={styles.palette}><View style={[styles.swatch, { backgroundColor: theme.brand.neon }]} /><View style={[styles.swatch, { backgroundColor: theme.brand.forest }]} /><View style={[styles.swatch, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1 }]} /><View style={[styles.swatch, { backgroundColor: theme.colors.surface }]} /></View></SurfaceCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  hit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24 },
  brandCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1 },
  brandTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 20 },
  copy: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 5 },
  section: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  palette: { flexDirection: 'row', gap: 10 },
  swatch: { width: 52, height: 52, borderRadius: 14 },
});
