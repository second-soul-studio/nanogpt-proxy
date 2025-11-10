import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App.jsx';
import { MemoryRouter } from 'react-router';

describe('<App />', () => {
  beforeEach(() => {});

  it('renders', () => {
    const queryClient = new QueryClient();

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </MantineProvider>
      </MemoryRouter>,
    );

    expect(container).toBeInTheDocument();
  });

  it('renders Index Level at root path', () => {
    const queryClient = new QueryClient();

    render(
      <MemoryRouter initialEntries={['/']}>
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </MantineProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Index Level/i)).toBeInTheDocument();
  });

  it('renders Not Found on invalid route', () => {
    const queryClient = new QueryClient();

    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <MantineProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </MantineProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
  });
});
