import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import TopHeader from '../top-header.tsx';
import { renderWithProviders } from '../../../../__tests__/utilities/test.utilities.tsx';

describe('TopHeader', () => {
  it('renders', () => {
    /* Act */
    renderWithProviders(<TopHeader />);

    /* Assert */
    expect(screen.getByRole('heading', { name: /NanoGPT Proxy/i })).toBeInTheDocument();
  });
});
