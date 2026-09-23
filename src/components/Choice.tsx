import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { ComponentProps, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { withBase } from '../utils';

/** Wraps a control in a <label> when given children, so the text is clickable. */
function Labelled({ children, control }: { children?: ReactNode; control: ReactNode }) {
  if (children === undefined) return control;
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is a Base UI checkbox/switch/radio (a button with an ARIA role) rendered inside
    <label className="tk-choice">
      {control}
      <span className="tk-choice-label">{children}</span>
    </label>
  );
}

export type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root> & {
  readonly children?: ReactNode;
};

export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <Labelled
      control={
        <BaseCheckbox.Root {...props} className={withBase('tk-checkbox', className)}>
          <BaseCheckbox.Indicator
            className="tk-checkbox-indicator"
            render={(indicatorProps, state) => (
              <span {...indicatorProps}>
                <Icon name={state.indeterminate ? 'minus' : 'check'} />
              </span>
            )}
          />
        </BaseCheckbox.Root>
      }
    >
      {children}
    </Labelled>
  );
}

export type SwitchProps = ComponentProps<typeof BaseSwitch.Root> & {
  readonly children?: ReactNode;
};

export function Switch({ children, className, ...props }: SwitchProps) {
  return (
    <Labelled
      control={
        <BaseSwitch.Root {...props} className={withBase('tk-switch', className)}>
          <BaseSwitch.Thumb className="tk-switch-thumb" />
        </BaseSwitch.Root>
      }
    >
      {children}
    </Labelled>
  );
}

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <BaseRadioGroup {...props} className={withBase('tk-radio-group', className)} />;
}

export type RadioProps = ComponentProps<typeof BaseRadio.Root> & { readonly children?: ReactNode };

export function Radio({ children, className, ...props }: RadioProps) {
  return (
    <Labelled
      control={
        <BaseRadio.Root {...props} className={withBase('tk-radio', className)}>
          <BaseRadio.Indicator className="tk-radio-indicator" />
        </BaseRadio.Root>
      }
    >
      {children}
    </Labelled>
  );
}
