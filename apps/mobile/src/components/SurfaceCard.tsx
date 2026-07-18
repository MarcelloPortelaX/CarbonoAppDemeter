import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useDemeterTheme } from '../theme/ThemeProvider';

export function SurfaceCard({ children, style, strong = false, onPress }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; strong?: boolean; onPress?: () => void }>) {
  const { theme } = useDemeterTheme();
  const cardStyle = [styles.base, {
    backgroundColor: strong ? theme.colors.surfaceStrong : theme.colors.surface,
    borderColor: strong ? theme.colors.borderStrong : theme.colors.border,
    shadowColor: theme.colors.shadow,
  }, style];
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => [...cardStyle, pressed && { opacity: 0.92 }]}>{children}</Pressable>;
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderRadius: 22, padding: 16, shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
});
