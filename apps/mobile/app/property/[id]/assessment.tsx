import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { NeonButton } from '../../../src/components/NeonButton';
import { Screen } from '../../../src/components/Screen';
import { useDemeterTheme } from '../../../src/theme/ThemeProvider';
import { usePropertyStore } from '../../../src/state/propertyStore';

type ThemeType = ReturnType<typeof useDemeterTheme>['theme'];

export default function AssessmentForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useDemeterTheme();
  const properties = usePropertyStore((state) => state.properties);
  const property = properties.find((item) => item.id === id);

  const [hasPossessionProof, setHasPossessionProof] = useState<boolean | null>(null);
  const [intendsRestoration, setIntendsRestoration] = useState<boolean | null>(null);
  const [recentClearing, setRecentClearing] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = hasPossessionProof !== null && intendsRestoration !== null && recentClearing !== null;

  const submitAssessmentOp = usePropertyStore((state) => state.submitAssessment);

  const handleSubmit = async () => {
    if (!isValid || !property) return;
    setSubmitting(true);
    setError(null);
    try {
      // Offline-first: enqueue operation
      submitAssessmentOp(property.id, {
        has_possession_proof: hasPossessionProof,
        intends_restoration: intendsRestoration,
        recent_clearing: recentClearing,
      });
      
      // Navegar para o passaporte em caso de sucesso
      router.replace({ pathname: '/passport/[id]', params: { id: property.id } });
    } catch (e) {
      console.warn('Failed to enqueue assessment:', e);
      setError('Falha ao registrar triagem. Verifique se o aplicativo está atualizado.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!property) return null;

  return (
    <Screen>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.hit} accessibilityLabel="Voltar">
          <MaterialCommunityIcons name="arrow-left" size={25} color={theme.colors.icon} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text, flex: 1, textAlign: 'center' }]}>Triagem Técnica</Text>
        <View style={styles.hit} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.question, { color: theme.colors.text }]}>1. Possui comprovante de posse ou propriedade da terra?</Text>
        <View style={styles.options}>
          <OptionButton label="Sim" selected={hasPossessionProof === true} onPress={() => setHasPossessionProof(true)} theme={theme} />
          <OptionButton label="Não" selected={hasPossessionProof === false} onPress={() => setHasPossessionProof(false)} theme={theme} />
        </View>

        <Text style={[styles.question, { color: theme.colors.text }]}>2. Tem intenção de realizar reflorestamento / restauração ecológica?</Text>
        <View style={styles.options}>
          <OptionButton label="Sim" selected={intendsRestoration === true} onPress={() => setIntendsRestoration(true)} theme={theme} />
          <OptionButton label="Não" selected={intendsRestoration === false} onPress={() => setIntendsRestoration(false)} theme={theme} />
        </View>

        <Text style={[styles.question, { color: theme.colors.text }]}>3. Houve supressão de vegetação nativa (desmatamento) nos últimos 10 anos?</Text>
        <View style={styles.options}>
          <OptionButton label="Sim" selected={recentClearing === true} onPress={() => setRecentClearing(true)} theme={theme} />
          <OptionButton label="Não" selected={recentClearing === false} onPress={() => setRecentClearing(false)} theme={theme} />
        </View>

        {error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        {submitting ? (
          <ActivityIndicator size="large" color={theme.brand.neon} />
        ) : (
          <View style={!isValid && styles.disabled}>
            <NeonButton label="Enviar triagem" icon="send-outline" onPress={handleSubmit} />
          </View>
        )}
      </View>
    </Screen>
  );
}

function OptionButton({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: ThemeType;
}) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? theme.brand.neon : theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, { color: selected ? theme.colors.onNeon : theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { height: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  hit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  content: { padding: 16, paddingBottom: 32, gap: 24 },
  question: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 8 },
  options: { flexDirection: 'row', gap: 12 },
  optionButton: { flex: 1, paddingVertical: 12, borderWidth: 1, borderRadius: 12, alignItems: 'center' },
  optionText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  footer: { padding: 16, borderTopWidth: 1, paddingBottom: 32 },
  disabled: { opacity: 0.55 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 12, textAlign: 'center' },
});
