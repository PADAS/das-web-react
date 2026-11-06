import ReactGA4 from 'react-ga4';
import userEvent from '@testing-library/user-event';

import { APP_ERROR_CATEGORY } from '../utils/analytics';
import getWindowLocation from '../utils/getWindowLocation';
import { render, screen } from '../test-utils';

import AppErrorBoundary from './';

jest.mock('react-ga4', () => ({
  event: jest.fn(),
}));

jest.mock('../utils/getWindowLocation', () => jest.fn());

const Thrower = () => {
  throw Object.assign(new Error('secret render failure'), { name: 'NotFoundError' });
};

describe('AppErrorBoundary', () => {
  const renderAppErrorBoundary = () => render(<AppErrorBoundary><Thrower /></AppErrorBoundary>);

  test('shows the fallback instead of an empty page when a child throws', () => {
    const { container } = renderAppErrorBoundary();

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  test('tracks one app error event labeled with the error name', () => {
    renderAppErrorBoundary();

    expect(ReactGA4.event).toHaveBeenCalledTimes(1);
    expect(ReactGA4.event).toHaveBeenCalledWith({
      action: 'See the app error screen',
      category: APP_ERROR_CATEGORY,
      label: 'NotFoundError',
    });
  });

  test('does not send the error message to analytics', () => {
    renderAppErrorBoundary();

    expect(JSON.stringify(ReactGA4.event.mock.calls)).not.toContain('secret render failure');
  });

  test('reloads the page when the user clicks Reload', async () => {
    const reload = jest.fn();
    getWindowLocation.mockReturnValue({ reload });

    renderAppErrorBoundary();
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
