import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { FinancialPillar, TransactionType } from '../../domain/types';
import { MoneyText, MoneyTextTone, IconButton } from '../atoms';
import { PALETTE } from '../../constants/theme';

export interface TransactionItemProps {
  id: string;
  title: string;
  accountName: string;
  date: string;
  amount: number;
  type: TransactionType;
  pillar?: FinancialPillar;
  isPrivate?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function TransactionItem({
  title,
  accountName,
  date,
  amount,
  type,
  pillar,
  isPrivate = false,
  onEdit,
  onDelete,
  style,
  className = '',
  testID,
}: TransactionItemProps) {
  const isIncome = type === 'income';
  const isTransfer = type === 'transfer';

  const tone: MoneyTextTone = isIncome
    ? 'growth'
    : isTransfer
    ? 'default'
    : 'default';

  const showSign = isIncome;
  const signedAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

  const IconComponent = isIncome
    ? ArrowDownLeft
    : isTransfer
    ? ArrowLeftRight
    : ArrowUpRight;

  const iconColor = isIncome
    ? PALETTE.light.financeGrowth
    : isTransfer
    ? PALETTE.light.brandPrimary
    : PALETTE.light.textSecondary;

  return (
    <View
      testID={testID}
      style={style}
      className={`min-h-[64px] py-3 px-2 flex-row items-center justify-between ${className}`}
    >
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-10 h-10 rounded-full bg-bg-subtle items-center justify-center mr-3">
          <IconComponent size={20} color={iconColor} strokeWidth={2.2} />
        </View>

        <View className="flex-1">
          <Text
            className="text-sm font-sans-bold text-text-primary"
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text className="text-xs font-sans text-text-muted mt-0.5" numberOfLines={1}>
            {`${accountName} • ${date}`}
          </Text>
        </View>
      </View>

      <View className="items-end mr-2">
        <MoneyText
          amount={signedAmount}
          variant="row"
          tone={tone}
          showSign={showSign}
          isPrivate={isPrivate}
        />
      </View>

      {(onEdit || onDelete) && (
        <View className="flex-row items-center space-x-0.5">
          {onEdit && (
            <IconButton
              accessibilityLabel={`Editar movimiento ${title}`}
              icon={<Pencil size={16} color={PALETTE.light.textSecondary} />}
              tone="ghost"
              onPress={onEdit}
            />
          )}
          {onDelete && (
            <IconButton
              accessibilityLabel={`Eliminar movimiento ${title}`}
              icon={<Trash2 size={16} color={PALETTE.light.financeDanger} />}
              tone="ghost"
              onPress={onDelete}
            />
          )}
        </View>
      )}
    </View>
  );
}
