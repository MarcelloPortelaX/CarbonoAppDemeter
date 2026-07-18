import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandGlyph } from '../../src/components/BrandGlyph';
import { Screen } from '../../src/components/Screen';
import { SurfaceCard } from '../../src/components/SurfaceCard';
import { usePropertyStore } from '../../src/state/propertyStore';
import { useDemeterTheme } from '../../src/theme/ThemeProvider';
import type { ThemeMode } from '../../src/theme/tokens';

const modes: { key: ThemeMode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'system', label: 'Sistema', icon: 'theme-light-dark' },
  { key: 'light', label: 'Claro', icon: 'white-balance-sunny' },
  { key: 'dark', label: 'Escuro', icon: 'weather-night' },
];

export default function Profile() {
  const { theme, mode, setMode } = useDemeterTheme();
  const pending = usePropertyStore((state) => state.outbox.length);
  const properties = usePropertyStore((state) => state.properties.length);
  const version = Constants.expoConfig?.version ?? '0.2.0';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <BrandGlyph size={64} glow />
          <View style={styles.headingText}>
            <Text style={[styles.eyebrow, { color: theme.brand.neon }]}>DEMETER CARBONO</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>Perfil e aplicativo</Text>
          </View>
        </View>

        <SurfaceCard>
          <Text style={[styles.section, { color: theme.colors.text }]}>Aparência</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>Escolha o tema ou acompanhe a configuração do aparelho.</Text>
          <View style={styles.row}>
            {modes.map((item) => {
              const selected = mode === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setMode(item.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tema ${item.label}`}
                  accessibilityState={{ selected }}
                  style={[
                    styles.option,
                    {
                      borderColor: selected ? theme.brand.neon : theme.colors.border,
                      backgroundColor: selected ? `${theme.brand.neon}18` : theme.colors.surfaceAlt,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={selected ? theme.brand.neon : theme.colors.icon} />
                  <Text style={[styles.optionText, { color: theme.colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: `${pending ? theme.colors.warning : theme.colors.success}1F` }]}>
            <MaterialCommunityIcons name={pending ? 'cloud-sync-outline' : 'cloud-check-outline'} size={25} color={pending ? theme.colors.warning : theme.colors.success} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.statusTitle, { color: theme.colors.text }]}>{pending ? 'Trabalho salvo no aparelho' : 'Dados locais atualizados'}</Text>
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>{pending ? `${pending} operações aguardam sincronização. Nada será perdido sem internet.` : `${properties} áreas disponíveis neste aparelho.`}</Text>
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.section, { color: theme.colors.text }]}>Escopo científico</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>Este MVP organiza áreas, triagem e evidências. Não emite, certifica nem garante créditos de carbono. Valores marcados como DEMO são apenas cenários demonstrativos.</Text>
        </SurfaceCard>

        <Text style={[styles.version, { color: theme.colors.textMuted }]}>Versão {version} · ambiente {__DEV__ ? 'desenvolvimento' : 'produção'}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32, gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, marginBottom: 2 },
  headingText: { flex: 1 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 25, marginTop: 3 },
  section: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, marginTop: 14 },
  option: { flex: 1, minHeight: 66, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 5 },
  optionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 3 },
  flex: { flex: 1 },
  version: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
