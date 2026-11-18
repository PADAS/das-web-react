import ReactGA4 from 'react-ga4';
import userEvent from '@testing-library/user-event';

import { APP_ERROR_CATEGORY } from '../utils/analytics';
import getWindowLocation from '../utils/getWindowLocation';
import { render, screen } from '../test-utils';

import RootErrorBoundary from './';

jest.mock('react-ga4', () => ({ event: jest.fn() }));
jest.mock('../utils/getWindowLocation', () => jest.fn());

const CrashingChild = ({ error = new Error('Unable to preload CSS for /assets/App-C0L_uhBQ.css') }) => {
  throw error;
};

describe('RootErrorBoundary', () => {
  let reload;

  beforeEach(() => {
    reload = jest.fn();
    getWindowLocation.mockImplementation(() => ({ reload }));

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderRootErrorBoundary = (children = <p>Map</p>) => render(<RootErrorBoundary>{children}</RootErrorBoundary>);

  test('renders its children when they do not crash', () => {
    renderRootErrorBoundary();

    expect(screen.getByText('Map')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();
  });

  test('shows a message asking to reload instead of a blank page when a child crashes', () => {
    renderRootErrorBoundary(<CrashingChild />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    expect(screen.getByText('EarthRanger ran into an unexpected problem. Reload the page to continue.')).toBeVisible();
  });

  test('moves the focus to the reload button, described by the error, when a child crashes', () => {
    renderRootErrorBoundary(<CrashingChild />);

    const reloadButton = screen.getByRole('button', { name: 'Reload' });
    expect(reloadButton).toHaveFocus();
    expect(reloadButton).toHaveAccessibleDescription(
      'Something went wrong EarthRanger ran into an unexpected problem. Reload the page to continue.'
    );
  });

  test('reloads the page when the user clicks the reload button', async () => {
    renderRootErrorBoundary(<CrashingChild />);

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  test('tracks one app error event labeled with the error name and not its message', () => {
    renderRootErrorBoundary(<CrashingChild error={Object.assign(new Error('secret'), { name: 'NotFoundError' })} />);

    expect(ReactGA4.event).toHaveBeenCalledTimes(1);
    expect(ReactGA4.event).toHaveBeenCalledWith({
      action: 'See the app error screen',
      category: APP_ERROR_CATEGORY,
      label: 'NotFoundError',
    });
  });

  test('does not track a second app error event when the user clicks the reload button', async () => {
    renderRootErrorBoundary(<CrashingChild />);

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(ReactGA4.event).toHaveBeenCalledTimes(1);
  });

  test('shows the reload button when a child throws null', () => {
    renderRootErrorBoundary(<CrashingChild error={null} />);

    expect(screen.getByRole('button', { name: 'Reload' })).toHaveFocus();
    expect(ReactGA4.event).toHaveBeenCalledWith(expect.objectContaining({ label: null }));
  });
});
