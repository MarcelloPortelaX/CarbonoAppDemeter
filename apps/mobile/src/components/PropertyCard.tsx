import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PropertySummary } from '../domain/models';
import { useDemeterTheme } from '../theme/ThemeProvider';
import { PropertyThumbnail } from './PropertyThumbnail';
import { StatusPill } from './StatusPill';

export function PropertyCard({ property, index, onPress }: { property: PropertySummary; index: number; onPress: () => void }) {
  const { theme } = useDemeterTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${property.name}, ${property.municipality}, ${property.areaHa.toLocaleString('pt-BR')} hectares`} onPress={onPress} style={({pressed})=>[styles.card,{backgroundColor:theme.colors.surface,borderColor:theme.colors.border,shadowColor:theme.colors.shadow},pressed&&{opacity:0.92}]}>
      <PropertyThumbnail variant={index}/><View style={styles.content}><Text numberOfLines={1} style={[styles.name,{color:theme.colors.text}]}>{property.name}</Text><Text style={[styles.city,{color:theme.colors.textMuted}]}>{property.municipality}, {property.state}</Text><View style={styles.meta}><MaterialCommunityIcons name="chart-areaspline" size={16} color={theme.colors.textMuted}/><Text style={[styles.area,{color:theme.colors.textMuted}]}>{property.areaHa.toLocaleString('pt-BR')} ha</Text><StatusPill status={property.status}/></View></View><MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted}/>
    </Pressable>
  );
}
const styles=StyleSheet.create({card:{minHeight:86,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,shadowOpacity:1,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:1},content:{flex:1,gap:3},name:{fontFamily:'Inter_600SemiBold',fontSize:15},city:{fontFamily:'Inter_400Regular',fontSize:11},meta:{flexDirection:'row',alignItems:'center',gap:5,marginTop:5},area:{fontFamily:'Inter_400Regular',fontSize:11,flex:1}});
