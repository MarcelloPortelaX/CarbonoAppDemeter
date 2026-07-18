import { StyleSheet, Text, View } from 'react-native';
import { PropertyStatus } from '../domain/models';
import { useDemeterTheme } from '../theme/ThemeProvider';

const labels: Record<PropertyStatus, string> = { analysis: 'Em análise', documentation: 'Documentação', eligible: 'Elegível', review: 'Revisão' };

export function StatusPill({ status }: { status: PropertyStatus }) {
  const { theme } = useDemeterTheme();
  const warning = status === 'documentation' || status === 'review';
  const color = warning ? theme.colors.warning : theme.colors.success;
  return <View style={[styles.pill, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}><Text style={[styles.text, { color }]}>{labels[status]}</Text></View>;
}

const styles = StyleSheet.create({ pill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }, text: { fontFamily: 'Inter_600SemiBold', fontSize: 11 } });
