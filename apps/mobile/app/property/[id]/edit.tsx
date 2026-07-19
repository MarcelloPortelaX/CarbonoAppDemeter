import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { NeonButton } from '../../../src/components/NeonButton';
import { Screen } from '../../../src/components/Screen';
import { usePropertyStore, isPropertyReadyForSync } from '../../../src/state/propertyStore';
import { useDemeterTheme } from '../../../src/theme/ThemeProvider';
import { LandUse } from '../../../src/domain/models';

const LAND_USE_OPTIONS: { value: LandUse; label: string }[] = [
  { value: 'degraded_pasture', label: 'Pastagem degradada' },
  { value: 'agriculture', label: 'Agricultura' },
  { value: 'abandoned', label: 'Área abandonada' },
  { value: 'agroforestry', label: 'Agrofloresta' },
  { value: 'native_vegetation', label: 'Vegetação nativa' },
];

export default function PropertyEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useDemeterTheme();
  
  const properties = usePropertyStore((state) => state.properties);
  const updatePropertyDraft = usePropertyStore((state) => state.updatePropertyDraft);
  const submitPropertyForSync = usePropertyStore((state) => state.submitPropertyForSync);
  
  const property = properties.find((item) => item.id === id);

  const [name, setName] = useState(property?.name || '');
  const [municipality, setMunicipality] = useState(property?.municipality || '');
  const [stateUF, setStateUF] = useState(property?.state || '');
  const [landUse, setLandUse] = useState<LandUse | null>(property?.landUse || null);

  if (!property) {
    return (
      <Screen style={styles.missing}>
        <Text style={{ color: theme.colors.text }}>Propriedade não encontrada.</Text>
      </Screen>
    );
  }

  const isValid = name.trim().length > 0 && municipality.trim().length > 0 && stateUF.trim().length > 0 && landUse !== null;

  const handleSave = () => {
    if (!isValid) return;

    updatePropertyDraft(property.id, {
      name: name.trim(),
      municipality: municipality.trim(),
      state: stateUF.trim().toUpperCase(),
      landUse: landUse as LandUse,
    });
    
    // Only submit for sync if it's currently a local draft
    if (property.syncStatus === 'local') {
      submitPropertyForSync(property.id);
    }
    
    router.replace({ pathname: '/property/[id]/map', params: { id: property.id } });
  };

  return (
    <Screen>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.hit} accessibilityLabel="Voltar">
          <MaterialCommunityIcons name="arrow-left" size={25} color={theme.colors.icon} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text, flex: 1, textAlign: 'center' }]}>Cadastro da Área</Text>
        <View style={styles.hit} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.colors.text }]}>Nome da propriedade</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          placeholder="Ex: Sítio São João"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Município</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          placeholder="Ex: Ribeirão Preto"
          placeholderTextColor={theme.colors.textMuted}
          value={municipality}
          onChangeText={setMunicipality}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Estado (UF)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          placeholder="Ex: SP"
          placeholderTextColor={theme.colors.textMuted}
          value={stateUF}
          onChangeText={setStateUF}
          maxLength={2}
          autoCapitalize="characters"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Uso do Solo</Text>
        <View style={styles.radioGroup}>
          {LAND_USE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.radioItem,
                { 
                  backgroundColor: landUse === option.value ? theme.brand.neon : theme.colors.surface,
                  borderColor: theme.colors.border 
                }
              ]}
              onPress={() => setLandUse(option.value)}
            >
              <Text style={{ 
                color: landUse === option.value ? theme.colors.onNeon : theme.colors.text,
                fontFamily: landUse === option.value ? 'Inter_600SemiBold' : 'Inter_400Regular' 
              }}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <View style={!isValid && styles.disabled}>
          <NeonButton label="Continuar para mapa" icon="map-outline" onPress={handleSave} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  hit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontFamily: 'Inter_400Regular', fontSize: 15 },
  radioGroup: { gap: 8, marginTop: 4 },
  radioItem: { padding: 16, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  footer: { padding: 16, borderTopWidth: 1, paddingBottom: 32 },
  missing: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.55 },
});
