import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DemeterThemeProvider } from '../src/theme/ThemeProvider';
import { processOutbox } from '../src/services/syncWorker';

SplashScreen.preventAutoHideAsync().catch(()=>undefined);

export default function RootLayout(){
    const[loaded]=useFonts({Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold,Inter_800ExtraBold});
    
    useEffect(()=>{
        if(loaded)SplashScreen.hideAsync().catch(()=>undefined);
        
        // Sync worker interval
        const interval = setInterval(() => {
            processOutbox();
        }, 15000);
        return () => clearInterval(interval);
    },[loaded]);
    
    if(!loaded)return null;
    return <GestureHandlerRootView style={{flex:1}}><DemeterThemeProvider><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}><Stack.Screen name="(tabs)"/><Stack.Screen name="property/[id]/map"/><Stack.Screen name="passport/[id]"/><Stack.Screen name="dev/design-system"/></Stack></DemeterThemeProvider></GestureHandlerRootView>
}
