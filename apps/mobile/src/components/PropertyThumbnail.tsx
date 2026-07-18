import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function PropertyThumbnail({ variant = 0 }: { variant?: number }) {
  const palettes = [
    ['#274E2F','#8FB357','#D6B96A'], ['#173E2B','#4D7A35','#9B7D3E'], ['#315E3B','#789C47','#B99E56']
  ] as const;
  const p = palettes[variant % palettes.length]!;
  return <LinearGradient colors={[p[0],p[1],p[2]]} style={styles.box}><Svg width="100%" height="100%" viewBox="0 0 100 70"><Path d="M0 52 C20 37 38 45 53 31 C69 16 83 24 100 9 L100 70 L0 70 Z" fill="rgba(15,52,25,0.58)"/><Path d="M0 60 L100 29" stroke="rgba(245,236,176,0.62)" strokeWidth="2"/><Path d="M43 0 L55 70" stroke="rgba(245,236,176,0.35)" strokeWidth="1"/></Svg></LinearGradient>;
}
const styles=StyleSheet.create({box:{width:82,height:62,borderRadius:12,overflow:'hidden'}});
