import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle, ScrollView } from 'react-native';
import {
  FinancialPillar,
  TransactionType,
  Wallet,
  QuickPreset,
} from '../../domain/types';
import { CreateQuickPresetInput, UpdateQuickPresetInput } from '../../db/types';
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
  presets?: QuickPreset[];
  initialPresetId?: string;
  onCreatePreset?: (input: CreateQuickPresetInput) => Promise<unknown> | unknown;
  onUpdatePreset?: (id: string, partial: UpdateQuickPresetInput) => Promise<unknown> | unknown;
  onDeletePreset?: (id: string) => Promise<unknown> | unknown;
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
  presets,
  initialPresetId,
  onCreatePreset,
  onUpdatePreset,
  onDeletePreset,
}: QuickRecordSheetProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [pillar, setPillar] = useState<FinancialPillar>('vital');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(initialPresetId);
  const [walletId, setWalletId] = useState<string>(
    initialWalletId || wallets[0]?.id || ''
  );
  const [destinationWalletId, setDestinationWalletId] = useState<string>(
    wallets[1]?.id || wallets[0]?.id || ''
  );
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Formulario mini para crear preset
  const [showNewPresetForm, setShowNewPresetForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');

  useEffect(() => {
    if (initialPresetId && presets && presets.length > 0) {
      const p = presets.find((item) => item.id === initialPresetId);
      if (p) {
        handleSelectPreset(p);
      }
    }
  }, [initialPresetId, presets]);

  const currentWallet = wallets.find((w) => w.id === walletId);
  const currentDestWallet = wallets.find((w) => w.id === destinationWalletId);
  const selectedPreset = presets?.find((p) => p.id === selectedPresetId);

  const handleSelectPreset = (p: QuickPreset) => {
    setSelectedPresetId(p.id);
    if (p.defaultAmount > 0) {
      setAmountStr(p.defaultAmount.toString());
    }
    if (p.categoryId) setCategoryId(p.categoryId);
    if (p.pillar) setPillar(p.pillar);
    if (p.name) setNote(p.name);
    setErrorMessage('');
  };

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

  const handleSaveNewPreset = async () => {
    if (!newPresetName.trim()) return;
    const amt = parseCOPInput(newPresetAmount);
    await onCreatePreset?.({
      name: newPresetName.trim().toUpperCase(),
      type: 'expense',
      defaultAmount: amt > 0 ? amt : undefined,
      categoryId: categoryId || 'carro',
      pillar: 'leisure',
    });
    setNewPresetName('');
    setNewPresetAmount('');
    setShowNewPresetForm(false);
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
      categoryId: categoryId || undefined,
      note: note.trim() || undefined,
    });
  };

  const numericAmount = parseCOPInput(amountStr);
  const showUpdatePriceBtn =
    selectedPreset &&
    selectedPreset.defaultAmount > 0 &&
    numericAmount > 0 &&
    numericAmount !== selectedPreset.defaultAmount &&
    !!onUpdatePreset;

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="none"
    >
      {/* Selector de Tipo (Gasto / Me enviaron plata / Traslado) >= 48dp */}
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
          accessibilityLabel="Me enviaron plata (Ingreso)"
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
            Me enviaron plata
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

      {/* Barra superior de Presets (1 toque) si es Gasto */}
      {type === 'expense' && presets && presets.length > 0 && (
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-sans-bold text-text-primary">
              Tus Botones Rápidos (1 toque)
            </Text>
            {onCreatePreset && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="+ Nuevo (ej. CARRO)"
                onPress={() => setShowNewPresetForm(!showNewPresetForm)}
                className="px-2 py-0.5 rounded bg-brandSoft/50 border border-brand/30"
              >
                <Text className="text-[11px] font-sans-bold text-brand">+ Nuevo (ej. CARRO)</Text>
              </Pressable>
            )}
          </View>

          {/* Formulario mini para crear preset nuevo si está abierto */}
          {showNewPresetForm && (
            <View className="p-3 bg-bg-subtle rounded-sm border border-border-subtle mb-2">
              <GuacaInput
                label="Nombre del botón"
                placeholder="Nombre del botón (ej. CARRO)"
                value={newPresetName}
                onChangeText={setNewPresetName}
                containerClassName="mb-2"
              />
              <GuacaInput
                label="Monto fijo opcional"
                placeholder="Monto fijo opcional (ej. 50000)"
                prefix="$"
                isNumericCOP={true}
                value={newPresetAmount}
                onChangeText={setNewPresetAmount}
                containerClassName="mb-2"
              />
              <View className="flex-row gap-2">
                <GuacaButton
                  title="Cancelar"
                  variant="ghost"
                  className="flex-1"
                  onPress={() => setShowNewPresetForm(false)}
                />
                <GuacaButton
                  title="Guardar"
                  variant="primary"
                  className="flex-1"
                  onPress={handleSaveNewPreset}
                />
              </View>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
            <View className="flex-row gap-2">
              {presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${preset.name}${
                      preset.defaultAmount > 0
                        ? ` · $ ${preset.defaultAmount.toLocaleString('es-CO')}`
                        : ''
                    }`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-full border min-h-[36px] justify-center items-center ${
                      isSelected
                        ? 'bg-brand border-brand'
                        : 'bg-surface border-border-subtle'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected
                          ? 'font-sans-bold text-white'
                          : 'font-sans-medium text-text-primary'
                      }`}
                    >
                      {preset.name}
                      {preset.defaultAmount > 0
                        ? ` · $ ${preset.defaultAmount.toLocaleString('es-CO')}`
                        : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

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

        {/* Botón sutil de actualizar precio fijo */}
        {showUpdatePriceBtn && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Actualizar precio fijo de ${selectedPreset.name} a $ ${numericAmount.toLocaleString('es-CO')}`}
            onPress={() => onUpdatePreset?.(selectedPreset.id, { defaultAmount: numericAmount })}
            className="mt-2 p-2 bg-brandSoft/40 border border-brand/30 rounded-sm items-center justify-center min-h-[44px]"
          >
            <Text className="text-xs font-sans-bold text-brand">
              Actualizar precio fijo de {selectedPreset.name} a $ {numericAmount.toLocaleString('es-CO')}
            </Text>
          </Pressable>
        )}
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
          {/* Botones de origen si es Ingreso */}
          {type === 'income' && (
            <View className="mb-4">
              <Text className="text-xs font-sans-medium text-text-secondary mb-2">
                ¿De dónde vino la plata?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { label: 'Me enviaron plata', cat: 'me_enviaron' },
                  { label: 'Mesada / Apoyo', cat: 'mesada' },
                  { label: 'Trabajo / Vuelta', cat: 'trabajo' },
                  { label: 'Me pagaron', cat: 'ingresos' },
                  { label: 'Regalo', cat: 'otros' },
                ].map((item) => (
                  <Pressable
                    key={item.cat}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => {
                      setCategoryId(item.cat);
                      if (!note) setNote(item.label);
                    }}
                    className={`px-3 py-1.5 rounded-full border min-h-[36px] justify-center items-center ${
                      categoryId === item.cat
                        ? 'bg-finance-growthSoft/70 border-finance-growth'
                        : 'bg-surface border-border-subtle'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        categoryId === item.cat
                          ? 'font-sans-bold text-finance-growth'
                          : 'font-sans text-text-secondary'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Selector de Pilares si es Gasto */}
          {type === 'expense' && (
            <>
              {/* Categorías cotidianas rápidas */}
              <View className="mb-3">
                <Text className="text-xs font-sans-medium text-text-secondary mb-2">
                  Categoría
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: 'comidas', label: 'Comidas', pillar: 'vital' as const },
                    { id: 'transporte', label: 'Transporte', pillar: 'vital' as const },
                    { id: 'carro', label: 'Carro', pillar: 'vital' as const },
                    { id: 'educacion', label: 'U y Estudio', pillar: 'vital' as const },
                    { id: 'ocio', label: 'Salidas', pillar: 'leisure' as const },
                    { id: 'compras', label: 'Compras', pillar: 'leisure' as const },
                    { id: 'vivienda', label: 'Arriendo', pillar: 'vital' as const },
                    { id: 'servicios', label: 'Servicios', pillar: 'vital' as const },
                    { id: 'otros', label: 'Varios', pillar: 'leisure' as const },
                  ].map((cat) => (
                    <Pressable
                      key={cat.id}
                      accessibilityRole="button"
                      accessibilityLabel={cat.label}
                      onPress={() => {
                        setCategoryId(cat.id);
                        setPillar(cat.pillar);
                      }}
                      className={`px-3 py-1.5 rounded-full border min-h-[36px] justify-center items-center ${
                        categoryId === cat.id
                          ? 'bg-brandSoft/70 border-brand'
                          : 'bg-surface border-border-subtle'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          categoryId === cat.id
                            ? 'font-sans-bold text-brand'
                            : 'font-sans text-text-secondary'
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

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
            </>
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

      {/* Campo de Nota adaptado según el Tipo */}
      <View className="mb-4">
        <GuacaInput
          label={
            type === 'income'
              ? '¿En qué fue o quién te envió la plata?'
              : 'Nota o detalle (opcional)'
          }
          placeholder={
            type === 'income'
              ? 'Ej: Para la semana, comida, pasajes...'
              : 'Ej: Almuerzo, Uber, Factura de luz...'
          }
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
