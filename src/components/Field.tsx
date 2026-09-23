import { Field as BaseField } from '@base-ui/react/field';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentProps } from 'react';
import { part, withBase } from '../utils';

/**
 * Label, control, description and error wired together for accessibility and
 * validation. Any tk control placed inside picks up the field's state.
 */
export const Field = {
  Root: part(BaseField.Root, 'tk-field'),
  Label: part(BaseField.Label, 'tk-field-label'),
  Description: part(BaseField.Description, 'tk-field-description'),
  Error: part(BaseField.Error, 'tk-field-error'),
};

export const Fieldset = {
  Root: part(BaseFieldset.Root, 'tk-fieldset'),
  Legend: part(BaseFieldset.Legend, 'tk-fieldset-legend'),
};

export type InputProps = Omit<ComponentProps<typeof BaseInput>, 'size'> & {
  readonly size?: 'sm' | 'md' | 'lg';
};

export function Input({ className, size = 'md', ...props }: InputProps) {
  return <BaseInput {...props} data-size={size} className={withBase('tk-input', className)} />;
}

export type TextareaProps = ComponentProps<'textarea'>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <BaseField.Control
      render={<textarea {...props} />}
      className={withBase('tk-input tk-textarea', className)}
    />
  );
}
