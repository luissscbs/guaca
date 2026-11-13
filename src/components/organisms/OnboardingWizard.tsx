import React, { useState } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';
import {
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react-native';
import { UserProfileType, VitalBreakdown } from '../../domain/types';
import { CreateQuickPresetInput } from '../../db/types';
import { calculateVitalMinimum } from '../../domain/coach';
import { parseCOPInput, formatCOP } from '../../utils/formatters';
import { GuacaInput } from '../atoms/GuacaInput';
import { GuacaButton } from '../atoms/GuacaButton';
import { StepperDot } from '../atoms/StepperDot';
import { MoneyText } from '../atoms/MoneyText';
import { GuacaDivider } from '../atoms/GuacaDivider';
import { PALETTE } from '../../constants/theme';

export interface OnboardingCompleteData {
  userName: string;
  currency: 'COP';
  initialWalletName: string;
  initialWalletBalance: number;
  netMonthlyIncome: number;
  monthStartDay: number;
  vitalBreakdown: VitalBreakdown;
  profileType?: UserProfileType;
  initialPresets?: CreateQuickPresetInput[];
}

export interface OnboardingWizardProps {
  onComplete: (data: OnboardingCompleteData) => void;
  initialStep?: number;
  initialProfileType?: UserProfileType;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function OnboardingWizard({
  onComplete,
  initialStep = 1,
  initialProfileType,
  style,
  className = '',
  testID,
}: OnboardingWizardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const [step, setStep] = useState<number>(initialStep);
  const [profileType, setProfileType] = useState<UserProfileType | undefined>(initialProfileType);

  // Paso 1
  const [userName, setUserName] = useState<string>('');
  const [walletName, setWalletName] = useState<string>('');
  const [walletBalanceStr, setWalletBalanceStr] = useState<string>('');

  // Paso 2
  const [incomeStr, setIncomeStr] = useState<string>('');
  const [payDayStr, setPayDayStr] = useState<string>('');

  // Paso 3 (Mínimo Vital 4 Casillas + Realidades)
  const [housingStr, setHousingStr] = useState<string>('');
  const [foodStr, setFoodStr] = useState<string>('');
  const [utilitiesStr, setUtilitiesStr] = useState<string>('');
  const [transportStr, setTransportStr] = useState<string>('');
  const [carStr, setCarStr] = useState<string>('');

  // Toggles de realidades
  const [hasFood, setHasFood] = useState<boolean>(true);
  const [hasTransport, setHasTransport] = useState<boolean>(true);
  const [hasCar, setHasCar] = useState<boolean>(false);
  const [hasStudy, setHasStudy] = useState<boolean>(false);
  const [hasHousing, setHasHousing] = useState<boolean>(true);
  const [hasUtilities, setHasUtilities] = useState<boolean>(true);

  // Presets personalizados en Onboarding
  const [customPresets, setCustomPresets] = useState<CreateQuickPresetInput[]>([]);
  const [showPresetForm, setShowPresetForm] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [presetAmountInput, setPresetAmountInput] = useState<string>('');
  const [presetCategoryInput, setPresetCategoryInput] = useState<string>('carro');

  const [stepError, setStepError] = useState<string>('');

  const vitalBreakdown: VitalBreakdown = {
    housing: hasHousing ? parseCOPInput(housingStr) : 0,
    food: hasFood ? parseCOPInput(foodStr) : 0,
    utilities: hasUtilities ? parseCOPInput(utilitiesStr) : 0,
    transport: (hasTransport ? parseCOPInput(transportStr) : 0) + (hasCar ? parseCOPInput(carStr) : 0),
  };

  const totalVital = calculateVitalMinimum(vitalBreakdown);

  const handleNextStep1 = () => {
    if (!userName.trim()) {
      setStepError('Escribe tu nombre para continuar');
      return;
    }
    if (!walletName.trim()) {
      setStepError('Ingresa el nombre de tu cuenta o billetera principal');
      return;
    }
    setStepError('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    const income = parseCOPInput(incomeStr);
    if (income < 0) {
      setStepError('El monto no puede ser negativo');
      return;
    }
    const day = parseInt(payDayStr, 10);
    if (payDayStr.trim() !== '' && (isNaN(day) || day < 1 || day > 28)) {
      setStepError('El día de pago debe ser entre 1 y 28');
      return;
    }
    setStepError('');
    setStep(3);
  };

  const handleAddPreset = () => {
    if (!presetNameInput.trim()) {
      setStepError('Escribe un nombre para tu botón rápido');
      return;
    }
    const amount = parseCOPInput(presetAmountInput);
    const newPreset: CreateQuickPresetInput = {
      name: presetNameInput.trim().toUpperCase(),
      type: 'expense',
      defaultAmount: amount > 0 ? amount : undefined,
      categoryId: presetCategoryInput || 'carro',
      pillar: 'leisure',
    };
    setCustomPresets([...customPresets, newPreset]);
    setPresetNameInput('');
    setPresetAmountInput('');
    setShowPresetForm(false);
    setStepError('');
  };

  const handleRemovePreset = (index: number) => {
    setCustomPresets(customPresets.filter((_, i) => i !== index));
  };

  const handleFinishStep3 = () => {
    onComplete({
      userName: userName.trim(),
      currency: 'COP',
      initialWalletName: walletName.trim(),
      initialWalletBalance: parseCOPInput(walletBalanceStr),
      netMonthlyIncome: parseCOPInput(incomeStr) || 0,
      monthStartDay: parseInt(payDayStr, 10) || 1,
      vitalBreakdown,
      ...(profileType ? { profileType } : {}),
      ...(customPresets.length > 0 ? { initialPresets: customPresets } : {}),
    });
  };

  return (
    <ScrollView
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Indicador de Pasos */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-sans-bold text-brand">
            Paso {step} de 3
          </Text>
          <View className="flex-row items-center">
            <StepperDot active={step === 1} completed={step > 1} />
            <StepperDot active={step === 2} completed={step > 2} />
            <StepperDot active={step === 3} completed={step > 3} />
          </View>
        </View>
        <GuacaDivider className="my-1" />
      </View>

      {/* Error de validación del paso si existe */}
      {stepError ? (
        <View className="bg-finance-dangerSoft/50 border border-finance-danger/30 rounded-sm p-2.5 mb-3">
          <Text className="text-xs font-sans-medium text-finance-danger">
            {stepError}
          </Text>
        </View>
      ) : null}

      {/* ========================================================= */}
      {/* PASO 1: Bienvenida, Nombre y Cuenta Inicial */}
      {/* ========================================================= */}
      {step === 1 && (
        <View className="space-y-3">
          <View className="mb-2">
            <Text className="text-lg font-sans-bold text-text-primary">
              Bienvenido a Guaca
            </Text>
            <Text className="text-xs font-sans text-text-secondary mt-0.5">
              Tu celu, tu plata, tu Guaca. Lo tuyo intocable, lo demás bajo control.
            </Text>
          </View>

          <GuacaInput
            label="¿Cómo te llamas?"
            placeholder="Tu nombre o apodo"
            value={userName}
            onChangeText={(t) => {
              setUserName(t);
              setStepError('');
            }}
          />

          {/* Moneda confirmada COP */}
          <View className="bg-bg-subtle p-3 rounded-sm border border-border-subtle flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-sans-medium text-text-secondary">
                Moneda oficial
              </Text>
              <Text className="text-sm font-sans-bold text-text-primary mt-0.5">
                Pesos Colombianos (COP)
              </Text>
            </View>
            <Text className="text-xs font-mono-semibold text-brand">✓ Confirmada</Text>
          </View>

          {/* Selector de Perfil */}
          <View className="pt-2">
            <Text className="text-xs font-sans-bold text-text-primary mb-2">
              ¿Cómo recibes tu plata?
            </Text>
            <View className="flex-row gap-2">
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
                <View className="flex-row items-center mb-1">
                  <Briefcase size={14} color={palette.brandPrimary} />
                  <Text className="ml-1.5 text-xs font-sans-bold text-text-primary">
                    Sueldo
                  </Text>
                </View>
                <Text className="text-[10px] font-sans text-text-muted">
                  Tengo sueldo fijo
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
                <View className="flex-row items-center mb-1">
                  <GraduationCap size={14} color={palette.brandPrimary} />
                  <Text className="ml-1.5 text-xs font-sans-bold text-text-primary">
                    Estudiante
                  </Text>
                </View>
                <Text className="text-[10px] font-sans text-text-muted">
                  Soy estudiante
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
                <View className="flex-row items-center mb-1">
                  <TrendingUp size={14} color={palette.brandPrimary} />
                  <Text className="ml-1.5 text-xs font-sans-bold text-text-primary">
                    Variable
                  </Text>
                </View>
                <Text className="text-[10px] font-sans text-text-muted">
                  Independiente
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="pt-2">
            <Text className="text-xs font-sans-bold text-text-primary mb-2">
              Tu primera cuenta o billetera
            </Text>
            <GuacaInput
              label="Nombre de tu cuenta"
              placeholder="Nombre de tu cuenta principal"
              value={walletName}
              onChangeText={(t) => {
                setWalletName(t);
                setStepError('');
              }}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="Saldo disponible hoy"
              placeholder="Saldo inicial"
              prefix="$"
              isNumericCOP={true}
              value={walletBalanceStr}
              onChangeText={setWalletBalanceStr}
            />
          </View>

          <View className="pt-4">
            <GuacaButton
              title="Siguiente"
              variant="primary"
              onPress={handleNextStep1}
              iconRight={<ArrowRight size={16} color="#FFFFFF" />}
              accessibilityLabel="Siguiente paso"
            />
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* PASO 2: Ingresos y Día de Pago */}
      {/* ========================================================= */}
      {step === 2 && (
        <View className="space-y-3">
          <View className="mb-2">
            <Text className="text-lg font-sans-bold text-text-primary">
              {profileType === 'student'
                ? 'Tu mesada o apoyo del mes'
                : profileType === 'variable'
                ? 'Tus Ingresos Promedio'
                : 'Tus Ingresos Mensuales'}
            </Text>
            <Text className="text-xs font-sans text-text-secondary mt-0.5">
              {profileType === 'student'
                ? 'Para saber con cuánta platica cuentas para blindar tus gastos y metas.'
                : 'Para saber con cuánta platica cuentas para blindar tu vida.'}
            </Text>
          </View>

          <GuacaInput
            label="¿Cuánto te entra limpio al mes?"
            placeholder="Ingreso neto al mes"
            prefix="$"
            isNumericCOP={true}
            value={incomeStr}
            onChangeText={(t) => {
              setIncomeStr(t);
              setStepError('');
            }}
            helperText="Ingreso neto luego de salud y pensión."
          />

          <GuacaInput
            label="¿Qué día del mes te pagan?"
            placeholder="Día de pago (1 al 28)"
            isNumericCOP={true}
            value={payDayStr}
            onChangeText={(t) => {
              setPayDayStr(t);
              setStepError('');
            }}
            helperText="Elige un número del 1 al 28 para iniciar tu ciclo mensual."
          />

          {/* Botones rápidos para $0 ingreso y día 1 */}
          <View className="flex-row gap-2 mt-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="No tengo ingreso fijo aún (solo usar lo que tengo hoy)"
              onPress={() => {
                setIncomeStr('0');
                setStepError('');
              }}
              className="flex-1 p-2.5 rounded-sm border border-border-subtle bg-bg-subtle min-h-[48px] justify-center items-center"
            >
              <Text className="text-[11px] font-sans-medium text-text-secondary text-center">
                No tengo ingreso fijo aún (solo usar lo que tengo hoy)
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sin día fijo (usar día 1)"
              onPress={() => {
                setPayDayStr('1');
                setStepError('');
              }}
              className="p-2.5 rounded-sm border border-border-subtle bg-bg-subtle min-h-[48px] justify-center items-center"
            >
              <Text className="text-[11px] font-sans-medium text-text-secondary text-center">
                Sin día fijo (usar día 1)
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2 pt-4">
            <View className="flex-1">
              <GuacaButton
                title="Atrás"
                variant="ghost"
                onPress={() => setStep(1)}
                iconLeft={<ArrowLeft size={16} color={palette.brandPrimary} />}
              />
            </View>
            <View className="flex-1">
              <GuacaButton
                title="Siguiente"
                variant="primary"
                onPress={handleNextStep2}
                iconRight={<ArrowRight size={16} color="#FFFFFF" />}
              />
            </View>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* PASO 3: Los 4 Pilares del Mínimo Vital Intocable */}
      {/* ========================================================= */}
      {step === 3 && (
        <View className="space-y-3">
          <View className="mb-2">
            <View className="flex-row items-center">
              <Shield size={20} color={palette.financeVital} strokeWidth={2.4} />
              <Text className="ml-2 text-lg font-sans-bold text-text-primary">
                Arma tu realidad: prende solo en lo que sí gastas
              </Text>
            </View>
            <Text className="text-xs font-sans text-text-secondary mt-1">
              {profileType === 'student'
                ? 'La suma exacta de lo que necesitas para techo, comida y servicios. Si vives con tu familia, deja Arriendo o Servicios en $0.'
                : 'La suma exacta de lo que necesitas para techo, comida y servicios. Nadie toca este dinero.'}
            </Text>
          </View>

          {/* Selector de realidades */}
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="🍔 Comidas"
              accessibilityState={{ selected: hasFood }}
              onPress={() => setHasFood(!hasFood)}
              className={`px-2.5 py-1.5 rounded-full border min-h-[36px] justify-center ${
                hasFood ? 'bg-brandSoft/60 border-brand' : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <Text className={`text-xs ${hasFood ? 'font-sans-bold text-brand' : 'font-sans text-text-muted'}`}>
                🍔 Comidas
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="🚌 Transporte"
              accessibilityState={{ selected: hasTransport }}
              onPress={() => setHasTransport(!hasTransport)}
              className={`px-2.5 py-1.5 rounded-full border min-h-[36px] justify-center ${
                hasTransport ? 'bg-brandSoft/60 border-brand' : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <Text className={`text-xs ${hasTransport ? 'font-sans-bold text-brand' : 'font-sans text-text-muted'}`}>
                🚌 Transporte
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="🚗 Carro / Gasolina"
              accessibilityState={{ selected: hasCar }}
              onPress={() => setHasCar(!hasCar)}
              className={`px-2.5 py-1.5 rounded-full border min-h-[36px] justify-center ${
                hasCar ? 'bg-brandSoft/60 border-brand' : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <Text className={`text-xs ${hasCar ? 'font-sans-bold text-brand' : 'font-sans text-text-muted'}`}>
                🚗 Carro / Gasolina
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="🎓 U / Estudio"
              accessibilityState={{ selected: hasStudy }}
              onPress={() => setHasStudy(!hasStudy)}
              className={`px-2.5 py-1.5 rounded-full border min-h-[36px] justify-center ${
                hasStudy ? 'bg-brandSoft/60 border-brand' : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <Text className={`text-xs ${hasStudy ? 'font-sans-bold text-brand' : 'font-sans text-text-muted'}`}>
                🎓 U / Estudio
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="🏠 Arriendo / Casa"
              accessibilityState={{ selected: hasHousing }}
              onPress={() => setHasHousing(!hasHousing)}
              className={`px-2.5 py-1.5 rounded-full border min-h-[36px] justify-center ${
                hasHousing ? 'bg-brandSoft/60 border-brand' : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <Text className={`text-xs ${hasHousing ? 'font-sans-bold text-brand' : 'font-sans text-text-muted'}`}>
                🏠 Arriendo / Casa
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="💡 Servicios"
              accessibilityState={{ selected: hasUtilities }}
              onPress={() => setHasUtilities(!hasUtilities)}
              className={`px-2.5 py-1.5 rounded-full border min-h-[36px] justify-center ${
                hasUtilities ? 'bg-brandSoft/60 border-brand' : 'bg-bg-subtle border-border-subtle'
              }`}
            >
              <Text className={`text-xs ${hasUtilities ? 'font-sans-bold text-brand' : 'font-sans text-text-muted'}`}>
                💡 Servicios
              </Text>
            </Pressable>
          </View>

          {/* Suma reactiva en tiempo real */}
          <View className="bg-finance-vitalSoft/40 border border-finance-vital/20 rounded-sm p-3 mb-2">
            <Text className="text-xs font-sans-medium text-finance-vital">
              Total Mínimo Vital Intocable
            </Text>
            <View className="mt-1">
              <MoneyText amount={totalVital} variant="hero" tone="vital" />
            </View>
          </View>

          {/* Las 4 Casillas Obligatorias */}
          <View className="space-y-3">
            {hasHousing && (
              <View>
                <Text className="text-xs font-sans-bold text-text-primary mb-1">
                  Vivienda
                </Text>
                <GuacaInput
                  placeholder="Vivienda"
                  prefix="$"
                  isNumericCOP={true}
                  value={housingStr}
                  onChangeText={setHousingStr}
                  helperText="Arriendo, cuota hipotecaria o administración."
                />
              </View>
            )}

            {hasFood && (
              <View>
                <Text className="text-xs font-sans-bold text-text-primary mb-1">
                  Mercado
                </Text>
                <GuacaInput
                  placeholder="Mercado"
                  prefix="$"
                  isNumericCOP={true}
                  value={foodStr}
                  onChangeText={setFoodStr}
                  helperText="Alimentación básica para el hogar."
                />
              </View>
            )}

            {hasUtilities && (
              <View>
                <Text className="text-xs font-sans-bold text-text-primary mb-1">
                  Servicios
                </Text>
                <GuacaInput
                  placeholder="Servicios"
                  prefix="$"
                  isNumericCOP={true}
                  value={utilitiesStr}
                  onChangeText={setUtilitiesStr}
                  helperText="Agua, luz, gas e internet indispensable."
                />
              </View>
            )}

            {hasTransport && (
              <View>
                <Text className="text-xs font-sans-bold text-text-primary mb-1">
                  Transporte
                </Text>
                <GuacaInput
                  placeholder="Transporte"
                  prefix="$"
                  isNumericCOP={true}
                  value={transportStr}
                  onChangeText={setTransportStr}
                  helperText="Pasajes o combustible para trabajar y moverte."
                />
              </View>
            )}

            {hasCar && (
              <View>
                <Text className="text-xs font-sans-bold text-text-primary mb-1">
                  Carro o Gasolina
                </Text>
                <GuacaInput
                  placeholder="Carro o gasolina"
                  prefix="$"
                  isNumericCOP={true}
                  value={carStr}
                  onChangeText={setCarStr}
                  helperText="Gasolina, seguro o parqueadero."
                />
              </View>
            )}
          </View>

          {/* Sección: Crear botón rápido con precio fijo */}
          <View className="mt-4 pt-3 border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-sans-bold text-text-primary">
                Tus botones rápidos (1 toque)
              </Text>
              {!showPresetForm && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="+ Crear botón rápido con precio fijo (ej. CARRO)"
                  onPress={() => setShowPresetForm(true)}
                  className="px-2.5 py-1 rounded bg-brandSoft/50 border border-brand/40 min-h-[36px] justify-center items-center"
                >
                  <Text className="text-xs font-sans-bold text-brand">
                    + Crear botón rápido con precio fijo (ej. CARRO)
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Formulario para agregar preset */}
            {showPresetForm && (
              <View className="p-3 bg-bg-subtle rounded-sm border border-border-subtle mb-3 space-y-2">
                <Text className="text-xs font-sans-bold text-text-primary">
                  Nuevo botón inteligente
                </Text>
                <GuacaInput
                  label="Nombre del botón"
                  placeholder="Nombre del botón (ej. CARRO)"
                  value={presetNameInput}
                  onChangeText={setPresetNameInput}
                />
                <GuacaInput
                  label="Monto fijo opcional"
                  placeholder="Monto fijo opcional (ej. 50000)"
                  prefix="$"
                  isNumericCOP={true}
                  value={presetAmountInput}
                  onChangeText={setPresetAmountInput}
                />
                <View className="flex-row gap-2 pt-2">
                  <View className="flex-1">
                    <GuacaButton
                      title="Cancelar"
                      variant="ghost"
                      onPress={() => setShowPresetForm(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <GuacaButton
                      title="Guardar botón"
                      variant="primary"
                      accessibilityLabel="Guardar botón"
                      onPress={handleAddPreset}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Lista de presets creados */}
            {customPresets.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-1">
                {customPresets.map((preset, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center bg-brandSoft/40 border border-brand/30 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-xs font-sans-bold text-brand">
                      {preset.name}
                      {preset.defaultAmount
                        ? ` · $ ${preset.defaultAmount.toLocaleString('es-CO')}`
                        : ''}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar botón ${preset.name}`}
                      onPress={() => handleRemovePreset(idx)}
                      className="ml-2 p-1"
                    >
                      <X size={12} color={palette.brandPrimary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="flex-row gap-2 pt-4">
            <View className="flex-1">
              <GuacaButton
                title="Atrás"
                variant="ghost"
                onPress={() => setStep(2)}
                iconLeft={<ArrowLeft size={16} color={palette.brandPrimary} />}
              />
            </View>
            <View className="flex-1">
              <GuacaButton
                title="Activar mi Guaca"
                variant="primary"
                onPress={handleFinishStep3}
                iconRight={<Sparkles size={16} color="#FFFFFF" />}
                accessibilityLabel="Activar mi Guaca"
              />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}