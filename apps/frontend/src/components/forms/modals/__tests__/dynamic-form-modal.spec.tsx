import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import type { FieldConfig } from '../../fields/field-config.ts';
import { DynamicFormModal, type DynamicFormModalProps } from '../dynamic-form-modal.tsx';
import { renderWithProviders } from '../../../../__tests__/utilities/test.utilities.tsx';
import i18nTest from '../../../../i18ntest.ts';

type TestFormValues = {
  enabled: boolean;
  email: string;
  password: string;
  role: string;
};

function buildFields(): FieldConfig<TestFormValues>[] {
  return [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'toggle',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      required: true,
      validate: (value) => {
        if (!value) {
          return 'Email is required';
        }
        return null;
      },
    },
    {
      key: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Enter password',
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'USER', label: 'USER' },
      ],
    },
  ];
}

function setup(overrides?: Partial<DynamicFormModalProps<TestFormValues>>) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  const props: DynamicFormModalProps<TestFormValues> = {
    opened: true,
    title: 'Test form',
    initialValues: {
      enabled: false,
      email: '',
      password: '',
      role: '',
    },
    fields: buildFields(),
    loading: false,
    onSubmit: onSubmit as DynamicFormModalProps<TestFormValues>['onSubmit'],
    onCancel,
    ...overrides,
  };

  renderWithProviders(<DynamicFormModal<TestFormValues> {...props} />);

  return { onSubmit, onCancel, props };
}

describe('<DynamicFormModal />', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18nTest.changeLanguage('en');
  });

  it('renders title, fields and buttons', () => {
    /* Arrange */
    setup();

    /* Assert */
    expect(screen.getByText('Test form')).toBeInTheDocument();

    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();

    const enabledSwitch = screen.getByRole('switch', { name: 'Enabled' });
    expect(enabledSwitch).toBeInTheDocument();

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    expect(emailInput).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText('Enter password');
    expect(passwordInput).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    /* Arrange */
    const { onCancel } = setup();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    /* Act */
    fireEvent.click(cancelButton);

    /* Assert */
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('runs field validation and prevents submit when there are errors', async () => {
    /* Arrange */
    const { onSubmit } = setup();

    const saveButton = screen.getByRole('button', { name: /save/i });

    /* Act */
    fireEvent.click(saveButton);

    /* Assert */
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('calls onSubmit with form values when Save is clicked and validation passes', async () => {
    /* Arrange */
    const { onSubmit } = setup();

    const emailInput = screen.getByRole('textbox', {
      name: 'Email',
    }) as HTMLInputElement;

    const passwordInput = screen.getByPlaceholderText('Enter password') as HTMLInputElement;

    const enabledSwitch = screen.getByRole('switch', {
      name: 'Enabled',
    });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(enabledSwitch).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(enabledSwitch); // toggle -> true

    const saveButton = screen.getByRole('button', { name: /save/i });

    /* Act */
    fireEvent.click(saveButton);

    /* Assert */
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedValues = onSubmit.mock.calls[0][0] as TestFormValues;
    expect(submittedValues.email).toBe('john.doe@example.com');
    expect(submittedValues.password).toBe('Secret123!');
    expect(submittedValues.enabled).toBe(true);
    expect(submittedValues.role).toBe('');
  });
});
