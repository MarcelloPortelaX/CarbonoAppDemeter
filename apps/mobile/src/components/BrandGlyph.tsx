import { Image, StyleSheet, View } from 'react-native';
import { useDemeterTheme } from '../theme/ThemeProvider';

const brandSymbol = require('../../assets/brand-symbol.png');

export function BrandGlyph({ size = 44, glow = false }: { size?: number; glow?: boolean }) {
  const { theme } = useDemeterTheme();

  return (
    <View
      accessibilityLabel="Símbolo Demeter Carbono"
      accessibilityRole="image"
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.colors.borderStrong,
        },
        glow && theme.mode === 'dark' && {
          shadowColor: theme.brand.neon,
          shadowOpacity: 0.34,
          shadowRadius: Math.min(size * 0.16, 12),
          elevation: 6,
        },
      ]}
    >
      <Image source={brandSymbol} resizeMode="cover" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
