import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities.tsx';
import AdminLayout from '../admin-layout.tsx';
import { Route, Routes } from 'react-router';

describe('AdminLayout', () => {
  it('renders', () => {
    /* Act */
    renderWithProviders(
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<div>Admin content</div>} />
        </Route>
      </Routes>,
    );

    /* Assert */
    expect(screen.getByRole('heading', { name: /NanoGPT Proxy/i })).toBeInTheDocument();
  });

  it('render content in outlet', () => {
    /* Act */
    renderWithProviders(
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<p>Dashboard content</p>} />
        </Route>
      </Routes>,
    );

    /* Assert */
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
