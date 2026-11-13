import React from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  Home,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Sparkles,
} from 'lucide-react-native';
import { PALETTE } from '../../constants/theme';
import { QuickFAB } from '../../components/atoms/QuickFAB';

export default function TabsLayout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.brandPrimary,
          tabBarInactiveTintColor: palette.textMuted,
          tabBarStyle: {
            backgroundColor: palette.bgSurface,
            borderTopColor: palette.borderSubtle,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarAccessibilityLabel: 'Pestaña Inicio',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="movements"
          options={{
            title: 'Movimientos',
            tabBarAccessibilityLabel: 'Pestaña Movimientos',
            tabBarIcon: ({ color, size }) => (
              <ArrowLeftRight size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Cuentas',
            tabBarAccessibilityLabel: 'Pestaña Cuentas',
            tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Presupuesto',
            tabBarAccessibilityLabel: 'Pestaña Presupuesto',
            tabBarIcon: ({ color, size }) => (
              <PieChart size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Tu Coach',
            tabBarAccessibilityLabel: 'Pestaña Tu Coach',
            tabBarIcon: ({ color, size }) => (
              <Sparkles size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* FAB Flotante hacia Anotar Rápido */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 76,
        }}
      >
        <QuickFAB
          onPress={() => router.push('/quick-record')}
          accessibilityLabel="Anotar movimiento rápido"
        />
      </View>
    </View>
  );
}
