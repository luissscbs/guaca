import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { cleanNumericInput } from '../../utils/formatters';

export interface GuacaInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  prefix?: string;
  helperText?: string;
  errorMessage?: string;
  isNumericCOP?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  containerClassName?: string;
}

export function GuacaInput({
  label,
  prefix,
  helperText,
  errorMessage,
  isNumericCOP = false,
  value,
  onChangeText,
  containerStyle,
  containerClassName = '',
  placeholderTextColor = '#485A53',
  ...restProps
}: GuacaInputProps) {
  const handleChangeText = (text: string) => {
    if (!onChangeText) return;
    if (isNumericCOP) {
      const cleaned = cleanNumericInput(text);
      onChangeText(cleaned);
    } else {
      onChangeText(text);
    }
  };

  const hasError = Boolean(errorMessage);

  const borderClass = hasError
    ? 'border-finance-danger'
    : 'border-border-subtle focus:border-brand';

  const inputContainerClasses = [
    'min-h-[48px] flex-row items-center bg-bg-subtle rounded-sm px-3.5 border',
    borderClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View style={containerStyle} className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-sans-medium text-text-secondary mb-1.5">
          {label}
        </Text>
      )}

      <View className={inputContainerClasses}>
        {prefix && (
          <Text className="text-base font-mono-semibold text-text-muted mr-1.5">
            {prefix}
          </Text>
        )}

        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor={placeholderTextColor}
          keyboardType={isNumericCOP ? 'numeric' : restProps.keyboardType}
          className={`flex-1 text-base text-text-primary ${
            isNumericCOP ? 'font-mono-semibold' : 'font-sans'
          }`}
          accessibilityLabel={label}
          {...restProps}
        />
      </View>

      {hasError ? (
        <Text
          className="text-xs font-sans-medium text-finance-danger mt-1"
          accessibilityRole="alert"
        >
          {errorMessage}
        </Text>
      ) : helperText ? (
        <Text className="text-xs font-sans text-text-muted mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
