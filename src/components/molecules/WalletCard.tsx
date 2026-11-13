import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import {
  Building2,
  Banknote,
  Smartphone,
  ShieldCheck,
  Pencil,
  Archive,
} from 'lucide-react-native';
import { Wallet, WalletType } from '../../domain/types';
import { MoneyText, IconButton } from '../atoms';
import { PALETTE } from '../../constants/theme';

export interface WalletCardProps {
  wallet: Wallet;
  isPrivate?: boolean;
  onEdit?: (wallet: Wallet) => void;
  onArchive?: (wallet: Wallet) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  bank: 'Cuenta Bancaria',
  cash: 'Efectivo',
  digital: 'Billetera Digital',
  vault: 'Bóveda Intocable',
};

function getWalletIcon(type: WalletType) {
  switch (type) {
    case 'bank':
      return <Building2 size={22} color={PALETTE.light.brandPrimary} />;
    case 'cash':
      return <Banknote size={22} color={PALETTE.light.financeGrowth} />;
    case 'digital':
      return <Smartphone size={22} color={PALETTE.light.financeVital} />;
    case 'vault':
      return <ShieldCheck size={22} color={PALETTE.light.brandPrimary} />;
  }
}

export function WalletCard({
  wallet,
  isPrivate = false,
  onEdit,
  onArchive,
  style,
  className = '',
  testID,
}: WalletCardProps) {
  const isVault = wallet.type === 'vault';
  const typeLabel = WALLET_TYPE_LABELS[wallet.type];

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-bg-surface border border-border-subtle rounded-sm p-4 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-full bg-bg-subtle items-center justify-center mr-3">
            {getWalletIcon(wallet.type)}
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-sans-bold text-text-primary"
              numberOfLines={1}
            >
              {wallet.name}
            </Text>
            <Text className="text-xs font-sans text-text-muted mt-0.5">
              {typeLabel}
            </Text>
          </View>
        </View>

        {isVault && (
          <View className="flex-row items-center bg-brand-soft px-2.5 py-1 rounded-full border border-brand/20">
            <ShieldCheck size={14} color={PALETTE.light.brandPrimary} />
            <Text className="text-xs font-sans-semibold text-brand ml-1">
              Bóveda protegida
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-end justify-between pt-2 border-t border-border-subtle">
        <View>
          <Text className="text-xs font-sans-medium text-text-secondary mb-1">
            Saldo disponible
          </Text>
          <MoneyText
            amount={wallet.balance}
            variant="macro"
            tone="default"
            isPrivate={isPrivate}
          />
        </View>

        <View className="flex-row items-center space-x-1">
          {onEdit && (
            <IconButton
              accessibilityLabel={`Editar ${wallet.name}`}
              icon={<Pencil size={18} color={PALETTE.light.textSecondary} />}
              tone="ghost"
              onPress={() => onEdit(wallet)}
            />
          )}
          {onArchive && (
            <IconButton
              accessibilityLabel={`Archivar ${wallet.name}`}
              icon={<Archive size={18} color={PALETTE.light.textSecondary} />}
              tone="ghost"
              onPress={() => onArchive(wallet)}
            />
          )}
        </View>
      </View>
    </View>
  );
}
