import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.tsx';
import { MantineProvider } from '@mantine/core';
import { queryClient } from './apis/query-client.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import './index.scss';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n.ts';
import { BrowserRouter } from 'react-router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MantineProvider defaultColorScheme="dark">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MantineProvider>
      </I18nextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
