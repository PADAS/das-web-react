import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import ErrorBoundary from './';

const Thrower = () => {
  throw new Error('render failed');
};

describe('ErrorBoundary', () => {
  test('renders the fallback instead of an empty page when a child throws', () => {
    const { container } = render(<ErrorBoundary><Thrower /></ErrorBoundary>);

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  test('reports the error to onError', () => {
    const onError = jest.fn();

    render(<ErrorBoundary onError={onError}><Thrower /></ErrorBoundary>);

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'render failed' }), expect.anything());
  });

  test('calls onReset when Reload is clicked', async () => {
    const onReset = jest.fn();

    render(<ErrorBoundary onReset={onReset}><Thrower /></ErrorBoundary>);
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
