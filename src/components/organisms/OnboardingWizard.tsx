import React, { useState } from 'react';
import { View, Text, StyleProp, ViewStyle, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Shield, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { VitalBreakdown } from '../../domain/types';
import { calculateVitalMinimum } from '../../domain/coach';
import { parseCOPInput } from '../../utils/formatters';
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
}

export interface OnboardingWizardProps {
  onComplete: (data: OnboardingCompleteData) => void;
  initialStep?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function OnboardingWizard({
  onComplete,
  initialStep = 1,
  style,
  className = '',
  testID,
}: OnboardingWizardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const [step, setStep] = useState<number>(initialStep);

  // Paso 1
  const [userName, setUserName] = useState<string>('');
  const [walletName, setWalletName] = useState<string>('');
  const [walletBalanceStr, setWalletBalanceStr] = useState<string>('');

  // Paso 2
  const [incomeStr, setIncomeStr] = useState<string>('');
  const [payDayStr, setPayDayStr] = useState<string>('');

  // Paso 3 (Mínimo Vital 4 Casillas)
  const [housingStr, setHousingStr] = useState<string>('');
  const [foodStr, setFoodStr] = useState<string>('');
  const [utilitiesStr, setUtilitiesStr] = useState<string>('');
  const [transportStr, setTransportStr] = useState<string>('');

  const [stepError, setStepError] = useState<string>('');

  const vitalBreakdown: VitalBreakdown = {
    housing: parseCOPInput(housingStr),
    food: parseCOPInput(foodStr),
    utilities: parseCOPInput(utilitiesStr),
    transport: parseCOPInput(transportStr),
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
    if (income <= 0) {
      setStepError('Ingresa tu ingreso neto mensual');
      return;
    }
    const day = parseInt(payDayStr, 10);
    if (isNaN(day) || day < 1 || day > 28) {
      setStepError('El día de pago debe ser entre 1 y 28');
      return;
    }
    setStepError('');
    setStep(3);
  };

  const handleFinishStep3 = () => {
    onComplete({
      userName: userName.trim(),
      currency: 'COP',
      initialWalletName: walletName.trim(),
      initialWalletBalance: parseCOPInput(walletBalanceStr),
      netMonthlyIncome: parseCOPInput(incomeStr),
      monthStartDay: parseInt(payDayStr, 10) || 1,
      vitalBreakdown,
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
              Tus Ingresos Mensuales
            </Text>
            <Text className="text-xs font-sans text-text-secondary mt-0.5">
              Para saber con cuánta platica cuentas para blindar tu vida.
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
                Lo sagrado de tu mes: Tu Mínimo Vital Intocable
              </Text>
            </View>
            <Text className="text-xs font-sans text-text-secondary mt-1">
              La suma exacta de lo que necesitas para techo, comida y servicios. Nadie
              toca este dinero.
            </Text>
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