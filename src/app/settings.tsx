import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  User,
  Shield,
  Palette,
  Eye,
  EyeOff,
  Key,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Save,
  ExternalLink,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useFinanceStore, ThemeMode } from '../store/useFinanceStore';
import { PALETTE } from '../constants/theme';
import { UserProfileType } from '../domain/types';
import { parseCOPInput } from '../utils/formatters';
import { GuacaInput } from '../components/atoms/GuacaInput';
import { GuacaButton } from '../components/atoms/GuacaButton';
import { GuacaSwitch } from '../components/atoms/GuacaSwitch';
import { GuacaDivider } from '../components/atoms/GuacaDivider';
import { BackupRestoreCard } from '../components/organisms/BackupRestoreCard';

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const settings = useFinanceStore((state) => state.settings);
  const themeMode = useFinanceStore((state) => state.themeMode);
  const updateSettings = useFinanceStore((state) => state.updateSettings);
  const setThemeMode = useFinanceStore((state) => state.setThemeMode);
  const togglePrivateMode = useFinanceStore((state) => state.togglePrivateMode);
  const exportBackup = useFinanceStore((state) => state.exportBackup);
  const importBackup = useFinanceStore((state) => state.importBackup);

  const [userName, setUserName] = useState(settings?.userName || '');
  const [profileType, setProfileType] = useState<UserProfileType>(
    settings?.profileType || 'salary'
  );
  const [incomeStr, setIncomeStr] = useState(
    settings?.netMonthlyIncome ? String(settings.netMonthlyIncome) : ''
  );

  // 4 Pilares
  const [housingStr, setHousingStr] = useState(
    settings?.vitalMinimumBreakdown?.housing ? String(settings.vitalMinimumBreakdown.housing) : ''
  );
  const [foodStr, setFoodStr] = useState(
    settings?.vitalMinimumBreakdown?.food ? String(settings.vitalMinimumBreakdown.food) : ''
  );
  const [utilitiesStr, setUtilitiesStr] = useState(
    settings?.vitalMinimumBreakdown?.utilities
      ? String(settings.vitalMinimumBreakdown.utilities)
      : ''
  );
  const [transportStr, setTransportStr] = useState(
    settings?.vitalMinimumBreakdown?.transport
      ? String(settings.vitalMinimumBreakdown.transport)
      : ''
  );

  // Gemini API Key
  const [apiKey, setApiKey] = useState(settings?.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings({
        userName: userName.trim() || 'Parcero',
        profileType,
        netMonthlyIncome: parseCOPInput(incomeStr),
        vitalMinimumBreakdown: {
          housing: parseCOPInput(housingStr),
          food: parseCOPInput(foodStr),
          utilities: parseCOPInput(utilitiesStr),
          transport: parseCOPInput(transportStr),
        },
        geminiApiKey: apiKey.trim() || undefined,
      });
      setIsSaving(false);
      Alert.alert('¡Ajustes guardados!', 'Tus cambios se han actualizado con éxito.');
    } catch (e) {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudieron guardar los ajustes.');
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportBackup();
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}guaca_backup_${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, json, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      }
    } catch (e) {
      console.warn('Export falló con sistema de archivos nativo:', e);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const res = await importBackup(content);
        if (!res.success) {
          Alert.alert('Error al restaurar', res.error || 'Archivo inválido.');
        }
      }
    } catch (e) {
      console.warn('Restore falló con sistema de archivos nativo:', e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      {/* Cabecera */}
      <View className="px-4 py-3 flex-row items-center border-b border-border-subtle bg-bg-surface">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-bg-subtle mr-3"
        >
          <ArrowLeft size={20} color={palette.brandPrimary} />
        </Pressable>
        <View>
          <Text className="text-lg font-sans-extrabold text-text-primary">
            Ajustes & Mínimo Vital
          </Text>
          <Text className="text-xs font-sans text-text-secondary">
            Personaliza tu Guaca, tu perfil y tu privacidad.
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* 1. PERFIL DE USUARIO */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <User size={18} color={palette.brandPrimary} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              Tu Perfil
            </Text>
          </View>

          <GuacaInput
            label="Tu nombre o apodo"
            placeholder="Tu nombre"
            value={userName}
            onChangeText={setUserName}
            containerClassName="mb-3"
          />

          <Text className="text-xs font-sans-bold text-text-primary mb-2">
            ¿Cómo recibes tu dinero?
          </Text>
          <View className="flex-row gap-2 mb-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tengo sueldo fijo"
              accessibilityState={{ selected: profileType === 'salary' }}
              onPress={() => setProfileType('salary')}
              className={`flex-1 p-2.5 rounded-sm border min-h-[48px] justify-center ${
                profileType === 'salary'
                  ? 'bg-brandSoft/60 border-brand'
                  : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <View className="flex-row items-center mb-0.5">
                <Briefcase size={14} color={palette.brandPrimary} />
                <Text className="ml-1 text-xs font-sans-bold text-text-primary">
                  Sueldo
                </Text>
              </View>
              <Text className="text-[10px] font-sans text-text-muted">
                Fijo quincenal o mes
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Soy estudiante / Recibo mesada"
              accessibilityState={{ selected: profileType === 'student' }}
              onPress={() => setProfileType('student')}
              className={`flex-1 p-2.5 rounded-sm border min-h-[48px] justify-center ${
                profileType === 'student'
                  ? 'bg-brandSoft/60 border-brand'
                  : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <View className="flex-row items-center mb-0.5">
                <GraduationCap size={14} color={palette.brandPrimary} />
                <Text className="ml-1 text-xs font-sans-bold text-text-primary">
                  Estudiante
                </Text>
              </View>
              <Text className="text-[10px] font-sans text-text-muted">
                Mesada o beca
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Soy independiente / Mi plata varía"
              accessibilityState={{ selected: profileType === 'variable' }}
              onPress={() => setProfileType('variable')}
              className={`flex-1 p-2.5 rounded-sm border min-h-[48px] justify-center ${
                profileType === 'variable'
                  ? 'bg-brandSoft/60 border-brand'
                  : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <View className="flex-row items-center mb-0.5">
                <TrendingUp size={14} color={palette.brandPrimary} />
                <Text className="ml-1 text-xs font-sans-bold text-text-primary">
                  Variable
                </Text>
              </View>
              <Text className="text-[10px] font-sans text-text-muted">
                Independiente
              </Text>
            </Pressable>
          </View>

          <GuacaInput
            label={
              profileType === 'student'
                ? 'Mesada o apoyo mensual aproximado'
                : 'Ingreso neto mensual promedio'
            }
            placeholder="0"
            prefix="$"
            isNumericCOP
            value={incomeStr}
            onChangeText={setIncomeStr}
          />
        </View>

        {/* ============================================================ */}
        {/* 2. LO SAGRADO DEL MES (MÍNIMO VITAL) */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Shield size={18} color={palette.financeVital} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              Lo Sagrado del Mes (Mínimo Vital)
            </Text>
          </View>
          <Text className="text-xs font-sans text-text-secondary mb-3">
            Los 4 pilares intocables. Si eres estudiante y vives en familia, puedes dejar Vivienda o Servicios en $0.
          </Text>

          <View className="space-y-3">
            <GuacaInput
              label="Vivienda (Arriendo o cuota)"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={housingStr}
              onChangeText={setHousingStr}
            />
            <GuacaInput
              label="Mercado y Alimentación"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={foodStr}
              onChangeText={setFoodStr}
            />
            <GuacaInput
              label="Servicios Públicos e Internet"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={utilitiesStr}
              onChangeText={setUtilitiesStr}
            />
            <GuacaInput
              label="Transporte y Pasajes"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={transportStr}
              onChangeText={setTransportStr}
            />
          </View>
        </View>

        {/* ============================================================ */}
        {/* 3. TEMA Y APARIENCIA */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Palette size={18} color={palette.brandPrimary} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              Tema y Apariencia
            </Text>
          </View>

          <View className="flex-row gap-2 mb-4">
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={`Tema ${mode}`}
                onPress={() => setThemeMode(mode)}
                className={`flex-1 p-2.5 rounded-sm border items-center justify-center min-h-[48px] ${
                  themeMode === mode
                    ? 'bg-brandSoft/70 border-brand'
                    : 'bg-bg-subtle border-border-subtle'
                }`}
              >
                <Text
                  className={`text-xs font-sans-semibold ${
                    themeMode === mode ? 'text-brand' : 'text-text-primary'
                  }`}
                >
                  {mode === 'system'
                    ? 'Sistema'
                    : mode === 'light'
                    ? 'Claro'
                    : 'Oscuro AMOLED'}
                </Text>
              </Pressable>
            ))}
          </View>

          <GuacaDivider className="my-2" />

          {/* Toggle de Modo Privado */}
          <View className="flex-row items-center justify-between pt-2">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-sans-bold text-text-primary">
                Modo Privacidad en Pantalla
              </Text>
              <Text className="text-xs font-sans text-text-secondary mt-0.5">
                Enmascara cifras de dinero con glifos de cerrojo ($ ••••••).
              </Text>
            </View>
            <GuacaSwitch
              value={!!settings?.isPrivateMode}
              onValueChange={togglePrivateMode}
              accessibilityLabel="Alternar modo privado"
            />
          </View>
        </View>

        {/* ============================================================ */}
        {/* 4. INTELIGENCIA ARTIFICIAL (GOOGLE GEMINI FLASH) */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Key size={18} color={palette.brandPrimary} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              Clave de Google Gemini Flash (Gratis)
            </Text>
          </View>
          <Text className="text-xs font-sans text-text-secondary mb-3">
            Tu Coach IA utiliza Gemini Flash. Es 100% gratuito directamente desde Google AI Studio. Nunca compartimos tu clave con nadie.
          </Text>

          <View className="mb-3">
            <GuacaInput
              label="Tu clave de API (AIzaSy...)"
              placeholder="Pega aquí tu clave de Gemini..."
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showApiKey}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showApiKey ? 'Ocultar clave' : 'Ver clave'}
              onPress={() => setShowApiKey(!showApiKey)}
              className="flex-row items-center mt-1.5 self-end px-1 py-1"
            >
              {showApiKey ? (
                <EyeOff size={14} color={palette.textSecondary} />
              ) : (
                <Eye size={14} color={palette.textSecondary} />
              )}
              <Text className="ml-1 text-xs font-sans-medium text-text-secondary">
                {showApiKey ? 'Ocultar clave' : 'Ver clave'}
              </Text>
            </Pressable>
          </View>

          {/* Mini guía de 3 pasos para dummies */}
          <View className="bg-bg-subtle/70 p-3 rounded-sm border border-border-subtle">
            <Text className="text-xs font-sans-bold text-text-primary mb-1.5">
              ¿Cómo sacar tu clave gratis en 1 minuto?
            </Text>
            <Text className="text-xs font-sans text-text-secondary leading-relaxed">
              1. Entra a <Text className="font-sans-bold text-brand">aistudio.google.com</Text> con tu Gmail.{'\n'}
              2. Toca el botón azul <Text className="font-sans-bold">"Get API key"</Text>.{'\n'}
              3. Copia el código que empieza por "AIzaSy..." y pégalo arriba. ¡Listo!
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 5. COPIA DE SEGURIDAD Y RESTAURACIÓN */}
        {/* ============================================================ */}
        <View className="mb-4">
          <BackupRestoreCard
            lastBackupDate={settings?.updatedAt?.split('T')[0] || 'Hoy'}
            onExportBackup={handleExportBackup}
            onRestoreBackup={handleRestoreBackup}
          />
        </View>

        {/* Botón Guardar Cambios */}
        <View className="pt-2 mb-8">
          <GuacaButton
            title={isSaving ? 'Guardando...' : 'Guardar ajustes'}
            variant="primary"
            loading={isSaving}
            iconLeft={<Save size={16} color="#FFFFFF" />}
            onPress={handleSave}
            accessibilityLabel="Guardar ajustes"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
