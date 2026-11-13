import '../../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { PALETTE } from '../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { GuacaSnackbar } from '../components/molecules/GuacaSnackbar';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { colorScheme, setColorScheme } = useColorScheme();

  const isReady = useFinanceStore((state) => state.isReady);
  const settings = useFinanceStore((state) => state.settings);
  const themeMode = useFinanceStore((state) => state.themeMode);
  const initStore = useFinanceStore((state) => state.initStore);
  const snackbar = useFinanceStore((state) => state.snackbar);
  const dismissSnackbar = useFinanceStore((state) => state.dismissSnackbar);

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  // Inicializar store al arrancar
  useEffect(() => {
    if (!isReady) {
      initStore().catch((err) => {
        console.error('Error inicializando store:', err);
      });
    }
  }, [isReady, initStore]);

  // Sincronizar tema con NativeWind
  useEffect(() => {
    try {
      if (setColorScheme) {
        if (themeMode === 'system') {
          setColorScheme('system');
        } else {
          setColorScheme(themeMode);
        }
      }
    } catch {
      // Ignorar en entornos de test si darkMode no se procesó
    }
  }, [themeMode, setColorScheme]);

  // Redirección segura según estado de Onboarding
  useEffect(() => {
    if (!isReady) return;

    const isOnboarded = !!settings?.onboardingCompleted;

    if (!isOnboarded && pathname !== '/onboarding') {
      router.replace('/onboarding');
    } else if (isOnboarded && pathname === '/onboarding') {
      router.replace('/(tabs)');
    }
  }, [isReady, settings?.onboardingCompleted, pathname, router]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: PALETTE.light.bgCanvas,
        }}
      >
        <ActivityIndicator size="large" color={PALETTE.light.brandPrimary} />
      </View>
    );
  }

  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="quick-record"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="reports" />
          <Stack.Screen name="settings" />
        </Stack>

        {/* Notificación Snackbar Global */}
        <GuacaSnackbar
          visible={snackbar.visible}
          message={snackbar.message}
          canUndo={snackbar.canUndo}
          onUndo={async () => {
            if (snackbar.onUndo) {
              await snackbar.onUndo();
            }
            dismissSnackbar();
          }}
          onDismiss={dismissSnackbar}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
