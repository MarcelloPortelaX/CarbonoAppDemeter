import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useDemeterTheme } from '../theme/ThemeProvider';

export function MiniLineChart({ width = 150, height = 56 }: { width?: number; height?: number }) {
  const { theme } = useDemeterTheme();
  return (
    <Svg width={width} height={height} viewBox="0 0 150 56">
      <Defs><LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={theme.brand.neon} stopOpacity="0.25"/><Stop offset="1" stopColor={theme.brand.neon} stopOpacity="0"/></LinearGradient></Defs>
      <Path d="M2 48 L18 42 L32 44 L47 34 L63 37 L79 28 L93 31 L109 21 L124 24 L148 8 L148 56 L2 56 Z" fill="url(#fill)" />
      <Path d="M2 48 L18 42 L32 44 L47 34 L63 37 L79 28 L93 31 L109 21 L124 24 L148 8" fill="none" stroke={theme.brand.neon} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
