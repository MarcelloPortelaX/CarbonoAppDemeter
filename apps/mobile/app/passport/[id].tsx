import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { BrandGlyph } from '../../src/components/BrandGlyph';
import { EmptyState } from '../../src/components/EmptyState';
import { InfoRowCard } from '../../src/components/InfoRowCard';
import { MiniLineChart } from '../../src/components/MiniLineChart';
import { Screen } from '../../src/components/Screen';
import { StatusPill } from '../../src/components/StatusPill';
import { StepProgress } from '../../src/components/StepProgress';
import { SurfaceCard } from '../../src/components/SurfaceCard';
import { usePropertyStore } from '../../src/state/propertyStore';
import { useDemeterTheme } from '../../src/theme/ThemeProvider';
import { getPassport } from '../../src/services/api';
import { Passport as PassportModel, ApiPassportRead } from '../../src/domain/models';

export default function Passport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useDemeterTheme();
  const property = usePropertyStore((state) => state.properties.find((item) => item.id === id));
  const localPassport = usePropertyStore((state) => (id ? state.passports[id] : undefined));
  const [remotePassport, setRemotePassport] = useState<PassportModel | null>(null);

  useEffect(() => {
    if (id && property?.remoteStatus !== 'local') {
      getPassport(id)
        .then((data: ApiPassportRead) => {
          const statusMap: Record<ApiPassportRead['eligibility'], PassportModel['status']> = {
            'potential': 'eligible',
            'needs_review': 'review',
            'not_ready': 'analysis'
          };
          
          const stageMap: Record<ApiPassportRead['stage'], 0 | 1 | 2 | 3 | 4> = {
            area: 0,
            eligibility: 1,
            documentation: 2,
            analysis: 3,
            emission: 4,
          };

          const mapped: PassportModel = {
            propertyId: data.property_id,
            status: statusMap[data.eligibility],
            resultState: data.scenario.maturity === 'screening' ? 'blocked' : 'demo',
            demoPotentialTco2e: data.scenario.value_tco2e ?? undefined,
            horizonYears: data.scenario.horizon_years ?? undefined,
            pendingCount: data.pending.length,
            currentStep: stageMap[data.stage],
            disclaimer: data.scenario.disclaimer
          };
          setRemotePassport(mapped);
        })
        .catch((e) => console.warn('Failed to load remote passport:', e));
    }
  }, [id, property?.remoteStatus]);

  const pendingAssessment = usePropertyStore((state) => state.outbox.find(o => o.kind === 'submit_assessment' && o.propertyId === id));
  const passport = remotePassport || localPassport;

  const sharePassport = async () => {
    if (!property || !passport) return;
    const potential = passport.resultState === 'demo'
      ? `Cenário demonstrativo: ${passport.demoPotentialTco2e?.toLocaleString('pt-BR')} tCO₂e em ${passport.horizonYears} anos.`
      : 'Quantificação ainda não habilitada.';
    await Share.share({
      title: `Passaporte preliminar — ${property.name}`,
      message: `${property.name}\n${property.municipality}, ${property.state}\nÁrea: ${property.areaHa.toLocaleString('pt-BR')} ha\n${potential}\n\n${passport.disclaimer}`,
    });
  };

  if (!property || !passport) {
    if (pendingAssessment) {
      return (
        <Screen style={styles.missing}>
          <EmptyState
            icon="cloud-sync"
            title="Sincronização pendente"
            message="Triagem salva no dispositivo. O passaporte será atualizado após a sincronização."
            actionLabel="Voltar às áreas"
            onAction={() => router.replace('/areas')}
          />
        </Screen>
      );
    }

    return (
      <Screen style={styles.missing}>
        <EmptyState
          icon="clipboard-remove-outline"
          title="Passaporte indisponível"
          message="Confirme primeiro o perímetro da área para gerar sua triagem preliminar."
          actionLabel="Voltar às áreas"
          onAction={() => router.replace('/areas')}
        />
      </Screen>
    );
  }

  const isDemo = passport.resultState === 'demo';
  const eligibility = passport.status === 'eligible' ? 'Triagem favorável' : 'Em análise';

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.hit}>
          <MaterialCommunityIcons name="arrow-left" size={25} color={theme.colors.icon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Passaporte de Carbono</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar passaporte preliminar" onPress={sharePassport} style={styles.hit}>
          <MaterialCommunityIcons name="share-variant-outline" size={24} color={theme.colors.icon} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SurfaceCard strong style={styles.identity}>
          <BrandGlyph size={76} glow />
          <View style={styles.identityText}>
            <Text style={[styles.property, { color: theme.colors.onStrong }]}>{property.name}</Text>
            <Text style={[styles.city, { color: theme.colors.onStrong, opacity: 0.72 }]}>{property.municipality}, {property.state}</Text>
            <View style={styles.pillWrap}><StatusPill status={passport.status} /></View>
          </View>
        </SurfaceCard>
        <SurfaceCard style={styles.potential}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="leaf-circle-outline" size={22} color={theme.colors.icon} />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Potencial preliminar</Text>
            {isDemo && <View style={[styles.demoPill, { borderColor: theme.colors.warning }]}><Text style={[styles.demoText, { color: theme.colors.warning }]}>DEMO</Text></View>}
          </View>
          {isDemo ? (
            <View style={styles.potentialBody}>
              <View style={styles.flex}>
                <Text style={[styles.big, { color: theme.colors.text }]}>{passport.demoPotentialTco2e?.toLocaleString('pt-BR')} <Text style={styles.unit}>tCO₂e</Text></Text>
                <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Cenário demonstrativo em {passport.horizonYears} anos</Text>
              </View>
              <MiniLineChart width={135} height={72} />
            </View>
          ) : <Text style={[styles.blocked, { color: theme.colors.textMuted }]}>Quantificação ainda não habilitada</Text>}
          <Text style={[styles.disclaimer, { color: theme.colors.warning }]}>{passport.disclaimer}</Text>
        </SurfaceCard>
        <InfoRowCard icon="shield-check-outline" title="Elegibilidade" value={eligibility} subtitle="Resultado de triagem; requer revisão metodológica" />
        <InfoRowCard icon="clipboard-alert-outline" title="Pendências" value={`${passport.pendingCount} itens`} subtitle="Verifique os documentos e evidências necessários" tone="warning" />
        <SurfaceCard>
          <View style={styles.progressTop}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Progresso</Text>
              <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Etapa atual</Text>
              <Text style={[styles.current, { color: theme.colors.warning }]}>Documentação</Text>
            </View>
            <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{passport.currentStep + 1} de 5 etapas</Text>
          </View>
          <StepProgress current={passport.currentStep} />
        </SurfaceCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: { padding: 16, justifyContent: 'center' },
  header: { height: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  hit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 17, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 120 },
  identityText: { flex: 1 },
  property: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  city: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  pillWrap: { alignSelf: 'flex-start', marginTop: 8 },
  potential: { gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flex: 1 },
  demoPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  demoText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  potentialBody: { flexDirection: 'row', alignItems: 'flex-end' },
  flex: { flex: 1 },
  big: { fontFamily: 'Inter_800ExtraBold', fontSize: 28 },
  unit: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  blocked: { fontFamily: 'Inter_600SemiBold', fontSize: 18, paddingVertical: 12 },
  disclaimer: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 15 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  current: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 4 },
});
