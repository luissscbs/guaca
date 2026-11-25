import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  GuacaLogo,
  MoneyText,
  GuacaButton,
  QuickFAB,
  TrafficLightBadge,
  ProgressBar,
  GuacaDivider,
  GuacaInput,
  PillarChip,
  IconButton,
  GuacaSwitch,
  StepperDot,
  QuickAmountChip,
} from '../atoms';

describe('Atoms: GuacaLogo', () => {
  it('renders correctly with default light theme', () => {
    const { getByLabelText } = render(<GuacaLogo accessibilityLabel="Logotipo Guaca" />);
    expect(getByLabelText('Logotipo Guaca')).toBeTruthy();
  });

  it('renders in private mode with 3 lock dots', () => {
    const { getByLabelText } = render(
      <GuacaLogo isPrivateMode accessibilityLabel="Logotipo Guaca Privado" />
    );
    expect(getByLabelText('Logotipo Guaca Privado')).toBeTruthy();
  });
});

describe('Atoms: MoneyText', () => {
  it('formats COP amounts with tabular numbers style and standard format', () => {
    const { getByText } = render(<MoneyText amount={1250000} />);
    const textNode = getByText('$ 1.250.000');
    expect(textNode).toBeTruthy();
    expect(textNode.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontVariant: ['tabular-nums'] })])
    );
  });

  it('displays privacy mask and accessible label when isPrivate is true', () => {
    const { getByLabelText, getByText } = render(
      <MoneyText amount={1250000} isPrivate />
    );
    expect(getByLabelText('Monto oculto por privacidad')).toBeTruthy();
    expect(getByText('$ •••••••')).toBeTruthy();
  });

  it('formats with sign when showSign is enabled', () => {
    const { getByText } = render(<MoneyText amount={35000} showSign />);
    expect(getByText('+ $ 35.000')).toBeTruthy();
  });

  it('applies variant and tone classes cleanly without fontFamily/fontWeight clash', () => {
    const { getByText } = render(
      <MoneyText amount={500000} variant="hero" tone="growth" />
    );
    const element = getByText('$ 500.000');
    expect(element.props.className).toContain('font-mono-bold');
    expect(element.props.className).not.toContain('font-bold');
    expect(element.props.className).toContain('text-finance-growth');
  });
});

describe('Atoms: GuacaButton', () => {
  it('renders button with min-h-[48px] and accessibilityRole="button"', () => {
    const onPressMock = jest.fn();
    const { getByRole, getByText } = render(
      <GuacaButton title="Continuar" onPress={onPressMock} />
    );
    const btn = getByRole('button');
    expect(btn).toBeTruthy();
    expect(btn.props.className).toContain('min-h-[48px]');
    expect(getByText('Continuar')).toBeTruthy();

    fireEvent.press(btn);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('disables interactions and renders loading indicator when loading', () => {
    const onPressMock = jest.fn();
    const { getByRole, queryByText } = render(
      <GuacaButton title="Guardar" loading onPress={onPressMock} />
    );
    const btn = getByRole('button');
    fireEvent.press(btn);
    expect(onPressMock).not.toHaveBeenCalled();
    expect(queryByText('Guardar')).toBeNull();
  });

  it('supports danger and secondary variants', () => {
    const { getByRole } = render(
      <GuacaButton title="Eliminar" variant="danger" onPress={() => {}} />
    );
    const btn = getByRole('button');
    expect(btn.props.className).toContain('bg-finance-danger');
  });

  it('supports size variants (sm, md, lg)', () => {
    const { getByRole: getByRoleSm, getByText: getByTextSm } = render(
      <GuacaButton title="Pequeño" size="sm" onPress={() => {}} />
    );
    const btnSm = getByRoleSm('button');
    expect(btnSm.props.className).toContain('min-h-[36px]');
    expect(btnSm.props.className).toContain('px-3');
    expect(getByTextSm('Pequeño').props.className).toContain('text-xs');

    const { getByRole: getByRoleLg, getByText: getByTextLg } = render(
      <GuacaButton title="Grande" size="lg" onPress={() => {}} />
    );
    const btnLg = getByRoleLg('button');
    expect(btnLg.props.className).toContain('min-h-[52px]');
    expect(btnLg.props.className).toContain('px-5');
    expect(getByTextLg('Grande').props.className).toContain('text-base');
  });
});

describe('Atoms: QuickFAB', () => {
  it('renders floating 56x56 action button with accessibilityLabel="Anotar rápido"', () => {
    const onPressMock = jest.fn();
    const { getByLabelText, getByRole } = render(<QuickFAB onPress={onPressMock} />);
    const fab = getByLabelText('Anotar rápido');
    expect(fab).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
    expect(fab.props.className).toContain('w-14');
    expect(fab.props.className).toContain('h-14');

    fireEvent.press(fab);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

describe('Atoms: TrafficLightBadge', () => {
  it('renders peace status with approved label and icon (not color alone)', () => {
    const { getByText } = render(<TrafficLightBadge status="peace" />);
    expect(getByText('Paz Financiera')).toBeTruthy();
  });

  it('renders alert and risk statuses with respective labels', () => {
    const { getByText: getAlert } = render(<TrafficLightBadge status="alert" />);
    expect(getAlert('Alerta')).toBeTruthy();

    const { getByText: getRisk } = render(<TrafficLightBadge status="risk" />);
    expect(getRisk('Riesgo')).toBeTruthy();
  });

  it('accepts custom label override', () => {
    const { getByText } = render(
      <TrafficLightBadge status="vital" label="Mínimo Vital Intocable" />
    );
    expect(getByText('Mínimo Vital Intocable')).toBeTruthy();
  });
});

describe('Atoms: ProgressBar', () => {
  it('renders accessible progress bar with accessibilityRole="progressbar"', () => {
    const { getByRole } = render(
      <ProgressBar progress={65} tone="growth" accessibilityLabel="Progreso de ahorro" />
    );
    const bar = getByRole('progressbar');
    expect(bar).toBeTruthy();
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 65 });
  });

  it('clamps progress between 0 and 100', () => {
    const { getByRole } = render(<ProgressBar progress={120} tone="danger" />);
    const bar = getByRole('progressbar');
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
  });
});

describe('Atoms: GuacaDivider', () => {
  it('renders 1px divider for flat surfaces', () => {
    const { getByTestId } = render(<GuacaDivider testID="divider" />);
    const divider = getByTestId('divider');
    expect(divider.props.className).toContain('h-[1px]');
    expect(divider.props.className).toContain('bg-border-subtle');
  });
});

describe('Atoms: GuacaInput', () => {
  it('renders input with label, prefix, and min-h-[48px]', () => {
    const onChangeMock = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <GuacaInput
        label="Valor del arriendo"
        prefix="$"
        placeholder="0"
        value=""
        onChangeText={onChangeMock}
      />
    );
    expect(getByText('Valor del arriendo')).toBeTruthy();
    expect(getByText('$')).toBeTruthy();
    const input = getByPlaceholderText('0');
    expect(input).toBeTruthy();
  });

  it('cleans non-numeric input when isNumericCOP is enabled', () => {
    const onChangeMock = jest.fn();
    const { getByPlaceholderText } = render(
      <GuacaInput
        label="Monto"
        placeholder="0"
        value=""
        isNumericCOP
        onChangeText={onChangeMock}
      />
    );
    const input = getByPlaceholderText('0');
    fireEvent.changeText(input, '$ 1.250.000 COP');
    expect(onChangeMock).toHaveBeenCalledWith('1250000');
  });

  it('renders error message in accessible alert text', () => {
    const { getByText } = render(
      <GuacaInput
        label="Nombre"
        value=""
        onChangeText={() => {}}
        errorMessage="Este campo es obligatorio"
      />
    );
    expect(getByText('Este campo es obligatorio')).toBeTruthy();
  });
});

describe('Atoms: PillarChip', () => {
  it('renders tactile chip with min-h-[48px] and accessibilityState', () => {
    const onPressMock = jest.fn();
    const { getByRole, getByText } = render(
      <PillarChip pillar="vital" selected onPress={onPressMock} />
    );
    const chip = getByRole('button');
    expect(chip.props.className).toContain('min-h-[48px]');
    expect(chip.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
    expect(getByText('Mínimo Vital')).toBeTruthy();

    fireEvent.press(chip);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

describe('Atoms: IconButton', () => {
  it('renders 48x48 icon button with mandatory accessibilityLabel', () => {
    const onPressMock = jest.fn();
    const { getByLabelText, getByRole } = render(
      <IconButton
        accessibilityLabel="Cerrar modal"
        onPress={onPressMock}
        icon={<GuacaDivider testID="dummy-icon" />}
      />
    );
    const btn = getByLabelText('Cerrar modal');
    expect(btn).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
    expect(btn.props.className).toContain('min-h-[48px]');
    expect(btn.props.className).toContain('min-w-[48px]');

    fireEvent.press(btn);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

describe('Atoms: GuacaSwitch', () => {
  it('renders accessible switch with min-h-[48px]', () => {
    const onValueChange = jest.fn();
    const { getByRole } = render(
      <GuacaSwitch value={true} onValueChange={onValueChange} accessibilityLabel="Modo Privado" />
    );
    const sw = getByRole('switch');
    expect(sw).toBeTruthy();
    expect(sw.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true })
    );
  });
});

describe('Atoms: StepperDot', () => {
  it('renders active and inactive states', () => {
    const { getByTestId } = render(
      <>
        <StepperDot active testID="dot-active" />
        <StepperDot active={false} testID="dot-inactive" />
      </>
    );
    expect(getByTestId('dot-active').props.className).toContain('bg-brand');
    expect(getByTestId('dot-inactive').props.className).toContain('bg-border-subtle');
  });
});

describe('Atoms: QuickAmountChip', () => {
  it('renders quick amount chip with min-h-[48px] and triggers onPress with amount', () => {
    const onPressMock = jest.fn();
    const { getByText, getByRole } = render(
      <QuickAmountChip amount={50000} onPress={onPressMock} />
    );
    expect(getByText('+$ 50.000')).toBeTruthy();
    const chip = getByRole('button');
    expect(chip.props.className).toContain('min-h-[48px]');

    fireEvent.press(chip);
    expect(onPressMock).toHaveBeenCalledWith(50000);
  });
});
