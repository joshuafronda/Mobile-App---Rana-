import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Suppress the "Reading from value during render" strict-mode warning
// produced by third-party pagination components (e.g. react-native-reanimated-carousel).
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

import { useColorScheme } from '@/hooks/use-color-scheme';
import { TravelProvider } from '@/src/context/TravelContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { WeatherProvider } from '@/src/context/WeatherContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
    <TravelProvider>
    <WeatherProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="(auth)"
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="fare-rates" options={{ headerShown: true, title: 'Transport Prices' }} />
          <Stack.Screen name="new-trip" options={{ headerShown: false }} />
          <Stack.Screen name="map-view" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </WeatherProvider>
    </TravelProvider>
    </LanguageProvider>
  );  
}
