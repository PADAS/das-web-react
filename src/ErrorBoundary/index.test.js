import { render, screen } from '../test-utils';

import ErrorBoundary from './';

const Thrower = ({ error }) => {
  throw error;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderErrorBoundary = (error) => render(<ErrorBoundary><Thrower error={error} /></ErrorBoundary>);

  test('shows the error message and a reload button when a child throws', () => {
    renderErrorBoundary(new Error('render failed'));

    expect(screen.getByText('render failed')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  test('shows the reload button when a child throws null', () => {
    renderErrorBoundary(null);

    expect(screen.getByRole('button', { name: 'Reload' })).toBeVisible();
  });
});
