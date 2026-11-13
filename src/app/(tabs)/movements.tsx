import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Search, Plus, Filter, Trash2 } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PALETTE } from '../../constants/theme';
import { Transaction, TransactionType } from '../../domain/types';
import { TransactionItem } from '../../components/molecules/TransactionItem';
import { EmptyState } from '../../components/molecules/EmptyState';
import { GuacaInput } from '../../components/atoms/GuacaInput';
import { GuacaDivider } from '../../components/atoms/GuacaDivider';
import { GuacaButton } from '../../components/atoms/GuacaButton';

type FilterType = 'all' | 'expense' | 'income' | 'transfer' | 'debt_payment';

export default function MovementsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const transactions = useFinanceStore((state) => state.transactions);
  const wallets = useFinanceStore((state) => state.wallets);
  const settings = useFinanceStore((state) => state.settings);
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);
  const loadMoreTransactions = useFinanceStore((state) => state.loadMoreTransactions);
  const setTransactionFilters = useFinanceStore((state) => state.setTransactionFilters);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const isPrivate = !!settings?.isPrivateMode;

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setTransactionFilters({ search: search.trim() || undefined, type: undefined, pillar: undefined });
    } else if (filter === 'debt_payment') {
      setTransactionFilters({ search: search.trim() || undefined, pillar: 'debt' });
    } else {
      setTransactionFilters({ search: search.trim() || undefined, type: filter as TransactionType, pillar: undefined });
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    const typeParam = activeFilter === 'all' || activeFilter === 'debt_payment' ? undefined : (activeFilter as TransactionType);
    const pillarParam = activeFilter === 'debt_payment' ? 'debt' : undefined;
    setTransactionFilters({
      search: text.trim() || undefined,
      type: typeParam,
      pillar: pillarParam,
    });
  };

  const handleDelete = (id: string, note?: string) => {
    Alert.alert(
      '¿Eliminar este movimiento?',
      `Se borrará "${note || 'este movimiento'}". Podrás deshacer la acción desde la barra inferior si cambias de opinión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  const getWalletName = (walletId: string) => {
    const w = wallets.find((item) => item.id === walletId);
    return w ? w.name : 'Cuenta';
  };

  const filterChips: Array<{ id: FilterType; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'expense', label: 'Gastos' },
    { id: 'income', label: 'Ingresos' },
    { id: 'transfer', label: 'Transferencias' },
    { id: 'debt_payment', label: 'Pago Tarjeta' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-xl font-sans-extrabold text-text-primary">
              Tus Movimientos
            </Text>
            <Text className="text-xs font-sans text-text-secondary mt-0.5">
              Cada peso registrado cuenta la historia de tu mes.
            </Text>
          </View>
        </View>

        {/* Buscador */}
        <View className="mb-2">
          <GuacaInput
            placeholder="Buscar por nota o comercio..."
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>

        {/* Chips de Filtro */}
        <View className="flex-row gap-2 py-1 flex-wrap">
          {filterChips.map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <Pressable
                key={chip.id}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleFilterChange(chip.id)}
                className={`min-h-[40px] px-3 py-1.5 rounded-full border items-center justify-center ${
                  isSelected
                    ? 'bg-brandSoft/70 border-brand'
                    : 'bg-bg-surface border-border-subtle'
                }`}
              >
                <Text
                  className={`text-xs font-sans-semibold ${
                    isSelected ? 'text-brand' : 'text-text-secondary'
                  }`}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <GuacaDivider className="my-1" />

      {/* Lista de Movimientos */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
        onEndReached={() => loadMoreTransactions()}
        onEndReachedThreshold={0.4}
        ItemSeparatorComponent={() => <GuacaDivider className="my-1" />}
        ListEmptyComponent={
          <EmptyState
            title="Sin movimientos registrados"
            description={
              search
                ? `No encontramos nada que coincida con "${search}". Intenta con otra palabra.`
                : 'Todavía no hay movimientos con este filtro. Anota uno nuevo con el botón (+).'
            }
          />
        }
        renderItem={({ item }) => (
          <TransactionItem
            id={item.id}
            title={item.note || item.categoryId || 'Movimiento'}
            accountName={getWalletName(item.walletId)}
            date={item.date}
            amount={item.amount}
            type={item.type}
            pillar={item.pillar}
            isPrivate={isPrivate}
            onDelete={() => handleDelete(item.id, item.note)}
          />
        )}
      />
    </SafeAreaView>
  );
}
