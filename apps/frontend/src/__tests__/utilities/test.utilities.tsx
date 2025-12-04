import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { queryClient } from '../../apis/query-client.ts';
import i18nTest from '../../i18ntest.ts';

export function renderWithProviders(children: ReactNode, initialEntries: string[] = ['/']) {
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nTest}>
        <MantineProvider defaultColorScheme="dark">
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </MantineProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}
