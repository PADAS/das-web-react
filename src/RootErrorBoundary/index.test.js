import userEvent from '@testing-library/user-event';

import getWindowLocation from '../utils/getWindowLocation';
import { render, screen } from '../test-utils';

import RootErrorBoundary from './';

jest.mock('../utils/getWindowLocation', () => jest.fn());

const CrashingChild = () => {
  throw new Error('Unable to preload CSS for /assets/App-C0L_uhBQ.css');
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

  test('reloads the page when the user clicks the reload button', async () => {
    renderRootErrorBoundary(<CrashingChild />);

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
