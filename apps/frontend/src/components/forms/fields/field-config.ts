import type { FieldType } from './field-type.ts';

export type FieldConfig<T> = {
  key: keyof T;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  validate?: (value: any, values: T) => string | null;
};
