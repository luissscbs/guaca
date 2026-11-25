import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Wallet as WalletIcon, CreditCard as CreditCardIcon, Landmark, Plus, X, ShieldCheck } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PALETTE } from '../../constants/theme';
import { WalletType } from '../../domain/types';
import { WalletCard } from '../../components/molecules/WalletCard';
import { CreditCardItem } from '../../components/molecules/CreditCardItem';
import { DebtItemCard } from '../../components/molecules/DebtItemCard';
import { EmptyState } from '../../components/molecules/EmptyState';
import { GuacaDivider } from '../../components/atoms/GuacaDivider';
import { GuacaButton } from '../../components/atoms/GuacaButton';
import { GuacaInput } from '../../components/atoms/GuacaInput';
import { parseCOPInput } from '../../utils/formatters';

export default function AccountsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const wallets = useFinanceStore((state) => state.wallets);
  const creditCards = useFinanceStore((state) => state.creditCards);
  const debts = useFinanceStore((state) => state.debts);
  const settings = useFinanceStore((state) => state.settings);

  const addWallet = useFinanceStore((state) => state.addWallet);
  const deleteWallet = useFinanceStore((state) => state.deleteWallet);
  const addCreditCard = useFinanceStore((state) => state.addCreditCard);
  const deleteCreditCard = useFinanceStore((state) => state.deleteCreditCard);
  const addDebt = useFinanceStore((state) => state.addDebt);
  const makeDebtPayment = useFinanceStore((state) => state.makeDebtPayment);
  const deleteDebt = useFinanceStore((state) => state.deleteDebt);

  const isPrivate = !!settings?.isPrivateMode;

  // Modales
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('bank');
  const [walletBalance, setWalletBalance] = useState('');

  const [showCardModal, setShowCardModal] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardCutoff, setCardCutoff] = useState('15');
  const [cardDue, setCardDue] = useState('5');

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtBalance, setDebtBalance] = useState('');
  const [debtMinPayment, setDebtMinPayment] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert('¡Ey, un detallito!', 'Porfa escribe el nombre de tu cuenta o billetera.');
      return;
    }
    try {
      await addWallet({
        name: walletName.trim(),
        type: walletType,
        balance: parseCOPInput(walletBalance),
      });
      setWalletName('');
      setWalletBalance('');
      setShowWalletModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos crear tu cuenta.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const handleCreateCard = async () => {
    const limit = parseCOPInput(cardLimit);
    if (!cardName.trim() || limit <= 0) {
      Alert.alert('¡Ey, un detallito!', 'Porfa escribe el nombre de la tarjeta y un cupo mayor a $ 0.');
      return;
    }
    try {
      await addCreditCard({
        name: cardName.trim(),
        creditLimit: limit,
        cutoffDay: parseInt(cardCutoff, 10) || 15,
        dueDay: parseInt(cardDue, 10) || 5,
      });
      setCardName('');
      setCardLimit('');
      setShowCardModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos guardar tu tarjeta.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const handleCreateDebt = async () => {
    const balance = parseCOPInput(debtBalance);
    const minPay = parseCOPInput(debtMinPayment);
    if (!debtName.trim() || balance <= 0 || minPay <= 0) {
      Alert.alert('¡Ey, un detallito!', 'Porfa anota el nombre de la deuda, el saldo y la cuota mensual mayor a $ 0.');
      return;
    }
    try {
      await addDebt({
        name: debtName.trim(),
        creditor: debtCreditor.trim() || 'Acreedor',
        originalBalance: balance,
        minimumMonthlyPayment: minPay,
      });
      setDebtName('');
      setDebtCreditor('');
      setDebtBalance('');
      setDebtMinPayment('');
      setShowDebtModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos anotar tu deuda.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const handleMakePayment = async () => {
    const amount = parseCOPInput(paymentAmount);
    if (!selectedDebtId || amount <= 0) {
      Alert.alert('¡Ey, un detallito!', 'Porfa ingresa un valor mayor a $ 0 para abonar a tu deuda.');
      return;
    }
    try {
      await makeDebtPayment(selectedDebtId, amount);
      setPaymentAmount('');
      setSelectedDebtId(null);
      setShowPaymentModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos registrar tu abono.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const confirmDeleteWallet = (id: string, name: string) => {
    Alert.alert('¿Eliminar cuenta?', `Se eliminará "${name}".`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteWallet(id) },
    ]);
  };

  const confirmDeleteCard = (id: string, name: string) => {
    Alert.alert('¿Eliminar tarjeta?', `Se eliminará "${name}".`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteCreditCard(id) },
    ]);
  };

  const confirmDeleteDebt = (id: string, name: string) => {
    Alert.alert('¿Eliminar deuda?', `Se eliminará "${name}".`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteDebt(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-3 mb-4">
          <Text className="text-xl font-sans-extrabold text-text-primary">
            Cuentas, Tarjetas y Deudas
          </Text>
          <Text className="text-xs font-sans text-text-secondary mt-0.5">
            El mapa completo de dónde está y adónde va tu plata.
          </Text>
        </View>

        {/* ============================================================ */}
        {/* SECCIÓN 1: BILLETERAS Y CUENTAS */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3 gap-2">
            <View className="flex-row items-center flex-1 mr-2">
              <WalletIcon size={18} color={palette.brandPrimary} />
              <Text className="ml-2 font-sans-bold text-base text-text-primary" numberOfLines={1}>
                Billeteras y Cuentas
              </Text>
            </View>
            <GuacaButton
              title="Nueva cuenta"
              variant="tonal"
              size="sm"
              iconLeft={<Plus size={14} color={palette.brandPrimary} />}
              onPress={() => setShowWalletModal(true)}
            />
          </View>

          {wallets.length === 0 ? (
            <EmptyState
              title="Sin cuentas registradas"
              description="Añade tu cuenta de ahorros, billetera digital o efectivo."
            />
          ) : (
            <View className="space-y-2">
              {wallets.map((w, idx) => (
                <View key={w.id}>
                  <WalletCard
                    wallet={w}
                    isPrivate={isPrivate}
                    onArchive={() => confirmDeleteWallet(w.id, w.name)}
                  />
                  {idx < wallets.length - 1 && <GuacaDivider className="my-1.5" />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* SECCIÓN 2: TARJETAS DE CRÉDITO */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3 gap-2">
            <View className="flex-row items-center flex-1 mr-2">
              <CreditCardIcon size={18} color={palette.brandPrimary} />
              <Text className="ml-2 font-sans-bold text-base text-text-primary" numberOfLines={1}>
                Tarjetas de Crédito
              </Text>
            </View>
            <GuacaButton
              title="Nueva tarjeta"
              variant="tonal"
              size="sm"
              iconLeft={<Plus size={14} color={palette.brandPrimary} />}
              onPress={() => setShowCardModal(true)}
            />
          </View>

          {creditCards.length === 0 ? (
            <EmptyState
              title="Sin tarjetas de crédito"
              description="Si usas tarjetas, anótalas para vigilar tu cupo y fechas de corte."
            />
          ) : (
            <View className="space-y-3">
              {creditCards.map((cc, idx) => (
                <View key={cc.id}>
                  <CreditCardItem
                    card={cc}
                    isPrivate={isPrivate}
                    onPayPress={() => router.push('/quick-record')}
                  />
                  {idx < creditCards.length - 1 && <GuacaDivider className="my-1.5" />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* SECCIÓN 3: DEUDAS Y PRÉSTAMOS */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3 gap-2">
            <View className="flex-row items-center flex-1 mr-2">
              <Landmark size={18} color={palette.financeDanger} />
              <Text className="ml-2 font-sans-bold text-base text-text-primary" numberOfLines={1}>
                Deudas y Créditos
              </Text>
            </View>
            <GuacaButton
              title="Anotar deuda"
              variant="tonal"
              size="sm"
              iconLeft={<Plus size={14} color={palette.brandPrimary} />}
              onPress={() => setShowDebtModal(true)}
            />
          </View>

          {debts.length === 0 ? (
            <EmptyState
              title="¡Libre de deudas!"
              description="No tienes deudas activas registradas. ¡Felicitaciones por cuidar tu tranquilidad!"
            />
          ) : (
            <View className="space-y-3">
              {debts.map((d, idx) => (
                <View key={d.id}>
                  <DebtItemCard
                    debt={d}
                    isPrivate={isPrivate}
                    onPayPress={() => {
                      setSelectedDebtId(d.id);
                      setShowPaymentModal(true);
                    }}
                  />
                  {idx < debts.length - 1 && <GuacaDivider className="my-1.5" />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal: Crear Billetera */}
      <Modal visible={showWalletModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Nueva Cuenta o Billetera
              </Text>
              <Pressable onPress={() => setShowWalletModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <GuacaInput
              label="Nombre de la cuenta"
              placeholder="Ej: Bancolombia, Nequi, Mi Guaca"
              value={walletName}
              onChangeText={setWalletName}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="Saldo actual disponible"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={walletBalance}
              onChangeText={setWalletBalance}
              containerClassName="mb-3"
            />
            <View className="flex-row gap-2 mb-4">
              {(['bank', 'cash', 'digital', 'vault'] as WalletType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setWalletType(t)}
                  className={`flex-1 p-2 rounded-sm border items-center ${
                    walletType === t ? 'bg-brandSoft/70 border-brand' : 'bg-bg-subtle border-border-subtle'
                  }`}
                >
                  <Text className="text-xs font-sans-semibold text-text-primary capitalize">
                    {t === 'vault' ? 'Bóveda' : t}
                  </Text>
                </Pressable>
              ))}
            </View>
            <GuacaButton title="Crear cuenta" variant="primary" onPress={handleCreateWallet} />
          </View>
        </View>
      </Modal>

      {/* Modal: Crear Tarjeta */}
      <Modal visible={showCardModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Nueva Tarjeta de Crédito
              </Text>
              <Pressable onPress={() => setShowCardModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <GuacaInput
              label="Nombre de la tarjeta"
              placeholder="Ej: Nu, Falabella, Bancolombia"
              value={cardName}
              onChangeText={setCardName}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="Cupo total aprobado"
              placeholder="Ej: 3000000"
              prefix="$"
              isNumericCOP
              value={cardLimit}
              onChangeText={setCardLimit}
              containerClassName="mb-3"
            />
            <View className="flex-row gap-2 mb-4">
              <GuacaInput
                label="Día de corte"
                placeholder="15"
                isNumericCOP
                value={cardCutoff}
                onChangeText={setCardCutoff}
                containerClassName="flex-1"
              />
              <GuacaInput
                label="Día límite de pago"
                placeholder="5"
                isNumericCOP
                value={cardDue}
                onChangeText={setCardDue}
                containerClassName="flex-1"
              />
            </View>
            <GuacaButton title="Guardar tarjeta" variant="primary" onPress={handleCreateCard} />
          </View>
        </View>
      </Modal>

      {/* Modal: Crear Deuda */}
      <Modal visible={showDebtModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Anotar Deuda o Préstamo
              </Text>
              <Pressable onPress={() => setShowDebtModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <GuacaInput
              label="¿Qué deuda es?"
              placeholder="Ej: Préstamo personal, Libre inversión"
              value={debtName}
              onChangeText={setDebtName}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="¿A quién le debes?"
              placeholder="Ej: Banco de Bogotá, Tía Gloria"
              value={debtCreditor}
              onChangeText={setDebtCreditor}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="Saldo pendiente"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={debtBalance}
              onChangeText={setDebtBalance}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="Cuota mínima mensual"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={debtMinPayment}
              onChangeText={setDebtMinPayment}
              containerClassName="mb-4"
            />
            <GuacaButton title="Registrar deuda" variant="primary" onPress={handleCreateDebt} />
          </View>
        </View>
      </Modal>

      {/* Modal: Abonar a Deuda */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Abonar a Deuda
              </Text>
              <Pressable onPress={() => setShowPaymentModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <GuacaInput
              label="¿Cuánto vas a abonar hoy?"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              helperText="Este abono reducirá el saldo de tu deuda directamente."
              containerClassName="mb-4"
            />
            <GuacaButton title="Confirmar abono" variant="primary" onPress={handleMakePayment} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
