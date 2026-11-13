import React, { useState } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import {
  FinancialPillar,
  TransactionType,
  Wallet,
} from '../../domain/types';
import { parseCOPInput } from '../../utils/formatters';
import { GuacaInput } from '../atoms/GuacaInput';
import { GuacaButton } from '../atoms/GuacaButton';
import { GuacaDivider } from '../atoms/GuacaDivider';
import { QuickAmountChip } from '../atoms/QuickAmountChip';
import { PillarChip } from '../atoms/PillarChip';
import { TransferAccountSelector } from '../molecules/TransferAccountSelector';
import { SelectFieldTrigger } from '../molecules/SelectFieldTrigger';

export interface QuickRecordData {
  type: TransactionType;
  amount: number;
  walletId: string;
  destinationWalletId?: string;
  pillar: FinancialPillar;
  categoryId?: string;
  note?: string;
}

export interface QuickRecordSheetProps {
  wallets: Wallet[];
  onSubmit: (data: QuickRecordData) => void;
  onClose?: () => void;
  initialType?: TransactionType;
  initialWalletId?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function QuickRecordSheet({
  wallets,
  onSubmit,
  onClose,
  initialType = 'expense',
  initialWalletId,
  style,
  className = '',
  testID,
}: QuickRecordSheetProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [pillar, setPillar] = useState<FinancialPillar>('vital');
  const [walletId, setWalletId] = useState<string>(
    initialWalletId || wallets[0]?.id || ''
  );
  const [destinationWalletId, setDestinationWalletId] = useState<string>(
    wallets[1]?.id || wallets[0]?.id || ''
  );
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentWallet = wallets.find((w) => w.id === walletId);
  const currentDestWallet = wallets.find((w) => w.id === destinationWalletId);

  const handleAddAmount = (extra: number) => {
    const current = parseCOPInput(amountStr);
    const sum = current + extra;
    setAmountStr(sum.toString());
    setErrorMessage('');
  };

  const handleCycleSourceWallet = () => {
    if (wallets.length <= 1) return;
    const currentIndex = wallets.findIndex((w) => w.id === walletId);
    const nextIndex = (currentIndex + 1) % wallets.length;
    setWalletId(wallets[nextIndex].id);
  };

  const handleCycleDestWallet = () => {
    if (wallets.length <= 1) return;
    const currentIndex = wallets.findIndex((w) => w.id === destinationWalletId);
    const nextIndex = (currentIndex + 1) % wallets.length;
    setDestinationWalletId(wallets[nextIndex].id);
  };

  const handleSubmit = () => {
    const numericAmount = parseCOPInput(amountStr);
    if (numericAmount <= 0) {
      setErrorMessage('Ingresa un monto mayor a cero');
      return;
    }

    if (!walletId) {
      setErrorMessage('Selecciona una cuenta');
      return;
    }

    if (type === 'transfer' && walletId === destinationWalletId) {
      setErrorMessage('La cuenta de origen y destino no pueden ser la misma');
      return;
    }

    setErrorMessage('');
    onSubmit({
      type,
      amount: numericAmount,
      walletId,
      destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
      pillar: type === 'expense' ? pillar : type === 'transfer' ? 'transfer' : 'income',
      note: note.trim() || undefined,
    });
  };

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="none"
    >
      {/* Selector de Tipo (Gasto / Ingreso / Traslado) >= 48dp */}
      <View className="flex-row rounded-sm bg-bg-subtle p-1 mb-4 border border-border-subtle">
        <Pressable
          onPress={() => {
            setType('expense');
            setErrorMessage('');
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Gasto"
          accessibilityState={{ selected: type === 'expense' }}
          className={`flex-1 min-h-[48px] items-center justify-center rounded-sm ${
            type === 'expense' ? 'bg-surface shadow-sm border border-border-subtle' : ''
          }`}
        >
          <Text
            className={`text-xs font-sans-bold ${
              type === 'expense' ? 'text-text-primary' : 'text-text-secondary'
            }`}
          >
            Gasto
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setType('income');
            setErrorMessage('');
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Ingreso"
          accessibilityState={{ selected: type === 'income' }}
          className={`flex-1 min-h-[48px] items-center justify-center rounded-sm ${
            type === 'income' ? 'bg-surface shadow-sm border border-border-subtle' : ''
          }`}
        >
          <Text
            className={`text-xs font-sans-bold ${
              type === 'income' ? 'text-finance-growth' : 'text-text-secondary'
            }`}
          >
            Ingreso
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setType('transfer');
            setErrorMessage('');
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Traslado"
          accessibilityState={{ selected: type === 'transfer' }}
          className={`flex-1 min-h-[48px] items-center justify-center rounded-sm ${
            type === 'transfer' ? 'bg-surface shadow-sm border border-border-subtle' : ''
          }`}
        >
          <Text
            className={`text-xs font-sans-bold ${
              type === 'transfer' ? 'text-brand' : 'text-text-secondary'
            }`}
          >
            Traslado
          </Text>
        </Pressable>
      </View>

      {/* Input de Monto */}
      <View className="mb-3">
        <GuacaInput
          label="Monto"
          placeholder="0"
          prefix="$"
          isNumericCOP={true}
          value={amountStr}
          onChangeText={(val) => {
            setAmountStr(val);
            setErrorMessage('');
          }}
          errorMessage={errorMessage}
        />
      </View>

      {/* Chips Rápidos de Monto (+10k, +20k, +50k, +100k) */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <QuickAmountChip amount={10000} onPress={handleAddAmount} />
        <QuickAmountChip amount={20000} onPress={handleAddAmount} />
        <QuickAmountChip amount={50000} onPress={handleAddAmount} />
        <QuickAmountChip amount={100000} onPress={handleAddAmount} />
      </View>

      <GuacaDivider className="my-2" />

      {/* Contenido condicional según el Tipo */}
      {type === 'transfer' ? (
        <View className="my-2">
          <TransferAccountSelector
            sourceAccountId={walletId}
            destinationAccountId={destinationWalletId}
            sourceAccountName={currentWallet?.name || 'Selecciona origen'}
            destinationAccountName={currentDestWallet?.name || 'Selecciona destino'}
            onSelectSource={handleCycleSourceWallet}
            onSelectDestination={handleCycleDestWallet}
          />
        </View>
      ) : (
        <View className="my-2">
          {/* Selector de Pilares si es Gasto */}
          {type === 'expense' && (
            <View className="mb-4">
              <Text className="text-xs font-sans-medium text-text-secondary mb-2">
                Clasifica tu gasto en un pilar
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <PillarChip
                  pillar="vital"
                  label="Mínimo Vital"
                  selected={pillar === 'vital'}
                  onPress={() => setPillar('vital')}
                />
                <PillarChip
                  pillar="growth"
                  label="Ahorro"
                  selected={pillar === 'growth'}
                  onPress={() => setPillar('growth')}
                />
                <PillarChip
                  pillar="leisure"
                  label="Ocio"
                  selected={pillar === 'leisure'}
                  onPress={() => setPillar('leisure')}
                />
                <PillarChip
                  pillar="debt"
                  label="Deudas"
                  selected={pillar === 'debt'}
                  onPress={() => setPillar('debt')}
                />
              </View>
            </View>
          )}

          {/* Selector de Cuenta */}
          <View className="mb-3">
            <SelectFieldTrigger
              label={type === 'expense' ? 'Cuenta pagadora' : 'Cuenta receptora'}
              value={currentWallet?.name || 'Selecciona una cuenta'}
              onPress={handleCycleSourceWallet}
            />
          </View>
        </View>
      )}

      {/* Campo opcional de Nota */}
      <View className="mb-4">
        <GuacaInput
          label="Nota o detalle (opcional)"
          placeholder="Ej: Almuerzo, Uber, Factura de luz..."
          value={note}
          onChangeText={setNote}
        />
      </View>

      {/* Botón de Envío */}
      <GuacaButton
        title="Registrar movimiento"
        variant="primary"
        onPress={handleSubmit}
        accessibilityLabel="Registrar movimiento"
      />
    </View>
  );
}