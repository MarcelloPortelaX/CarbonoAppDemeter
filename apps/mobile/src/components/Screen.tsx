import React from 'react';
import { SafeAreaView, StyleSheet, View, ViewStyle } from 'react-native';
import { useDemeterTheme } from '../theme/ThemeProvider';
export function Screen({ children, style }: React.PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>) { const {theme}=useDemeterTheme(); return <SafeAreaView style={[styles.safe,{backgroundColor:theme.colors.background}]}><View style={[styles.inner,style]}>{children}</View></SafeAreaView> }
const styles=StyleSheet.create({safe:{flex:1},inner:{flex:1}});
