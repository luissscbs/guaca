import React, { useState } from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { HardDriveDownload, FolderUp, ShieldCheck, AlertTriangle } from 'lucide-react-native';
import { GuacaButton } from '../atoms/GuacaButton';
import { GuacaDivider } from '../atoms/GuacaDivider';
import { PALETTE } from '../../constants/theme';

export interface BackupRestoreCardProps {
  lastBackupDate?: string;
  onExportBackup: () => Promise<boolean | void> | boolean | void;
  onRestoreBackup: (fileContent?: string) => Promise<boolean | void> | boolean | void;
  isExporting?: boolean;
  isRestoring?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function BackupRestoreCard({
  lastBackupDate,
  onExportBackup,
  onRestoreBackup,
  isExporting = false,
  isRestoring = false,
  style,
  className = '',
  testID,
}: BackupRestoreCardProps) {
  const [showConfirmRestore, setShowConfirmRestore] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setStatusMessage(null);
    try {
      await onExportBackup();
      setStatusMessage('Copia exportada exitosamente.');
    } catch {
      setStatusMessage('Hubo un error al exportar la copia.');
    }
  };

  const handleRestoreClick = () => {
    setShowConfirmRestore(true);
    setStatusMessage(null);
  };

  const handleConfirmRestore = async () => {
    setShowConfirmRestore(false);
    try {
      await onRestoreBackup();
      setStatusMessage('Datos restaurados correctamente.');
    } catch {
      setStatusMessage('Hubo un error al restaurar los datos.');
    }
  };

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      {/* Encabezado */}
      <View className="flex-row items-center mb-2">
        <ShieldCheck size={20} color={PALETTE.light.brandPrimary} strokeWidth={2.4} />
        <Text className="ml-2 text-sm font-sans-bold text-text-primary">
          Copia de Seguridad 100% Local
        </Text>
      </View>

      <Text className="text-xs font-sans text-text-secondary leading-relaxed mb-3">
        Tus datos nunca salen de tu celular. No hay servidores ni nube externa. Guarda una
        copia en tu almacenamiento o restaura tus finanzas cuando lo necesites.
      </Text>

      {/* Estado del último respaldo */}
      <View className="bg-bg-subtle p-3 rounded-sm border border-border-subtle mb-3">
        <Text className="text-xs font-sans text-text-muted">
          Último respaldo: {lastBackupDate || 'Nunca'}
        </Text>
      </View>

      {/* Mensaje de estado/feedback */}
      {statusMessage && (
        <View className="bg-brand-soft p-2.5 rounded-sm border border-brand/20 mb-3">
          <Text className="text-xs font-sans-medium text-brand">
            {statusMessage}
          </Text>
        </View>
      )}

      {/* Diálogo de Confirmación para Restaurar */}
      {showConfirmRestore ? (
        <View className="bg-finance-dangerSoft/50 border border-finance-danger/30 rounded-sm p-3 mb-3">
          <View className="flex-row items-center mb-1.5">
            <AlertTriangle size={16} color={PALETTE.light.financeDanger} strokeWidth={2.4} />
            <Text className="ml-1.5 text-xs font-sans-bold text-finance-danger">
              ¿Confirmas la restauración?
            </Text>
          </View>
          <Text className="text-xs font-sans text-text-secondary leading-relaxed mb-3">
            Se reemplazarán los datos actuales con la copia de seguridad. Te sugerimos exportar
            un respaldo previo si tienes información sin guardar.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <GuacaButton
                title="Cancelar"
                variant="ghost"
                onPress={() => setShowConfirmRestore(false)}
              />
            </View>
            <View className="flex-1">
              <GuacaButton
                title="Sí, restaurar datos"
                variant="danger"
                onPress={handleConfirmRestore}
                loading={isRestoring}
              />
            </View>
          </View>
        </View>
      ) : null}

      <GuacaDivider className="my-1 mb-3" />

      {/* Botones de Acción */}
      <View className="space-y-2.5">
        <GuacaButton
          title="Exportar copia de seguridad (.json)"
          variant="secondary"
          onPress={handleExport}
          loading={isExporting}
          iconLeft={<HardDriveDownload size={16} color={PALETTE.light.brandPrimary} />}
          accessibilityLabel="Exportar copia de seguridad"
        />

        <GuacaButton
          title="Restaurar desde archivo (.json)"
          variant="secondary"
          onPress={handleRestoreClick}
          loading={isRestoring}
          iconLeft={<FolderUp size={16} color={PALETTE.light.textSecondary} />}
          accessibilityLabel="Restaurar desde archivo"
        />
      </View>
    </View>
  );
}