import { Link, useLocation, useNavigate as useRouterNavigate } from 'react-router';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';

import useFeedTableView, { resetFeedTableViewChoices, useRestoreFeedTableView } from './useFeedTableView';

const Harness = () => {
  const { pathname, search } = useLocation();
  const routerNavigate = useRouterNavigate();
  const { isTableView, toggleTableView } = useFeedTableView();
  useRestoreFeedTableView();

  return <>
    <span data-testid="location">{`${pathname}${search}`}</span>
    <span data-testid="view">{isTableView ? 'table' : 'feed'}</span>

    <button onClick={toggleTableView} type="button">Toggle</button>
    <button onClick={() => routerNavigate('/events/event-1')} type="button">Open item</button>
    <button onClick={() => routerNavigate(-1)} type="button">Back</button>
    <Link to="/events">Events tab</Link>
    <Link to="/patrols">Patrols tab</Link>
  </>;
};

const renderAt = (url) => render(<Provider store={mockStore({ view: {} })}><Harness /></Provider>, {
  initialEntries: [url],
});

describe('useFeedTableView', () => {
  beforeEach(() => {
    resetFeedTableViewChoices();
  });

  test('opens the table from a shared table link, and remembers it', async () => {
    renderAt('/events?view=table');

    expect(screen.getByTestId('view')).toHaveTextContent('table');

    await userEvent.click(screen.getByRole('button', { name: 'Open item' }));
    await userEvent.click(screen.getByRole('link', { name: 'Events tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/events?view=table');
  });

  test('forgets the table view when the page is reloaded', async () => {
    const { unmount } = renderAt('/events');
    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    unmount();

    resetFeedTableViewChoices();
    renderAt('/events');

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);
  });

  test('returns to the table after opening an item, by Back or by the tab link', async () => {
    renderAt('/events');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open item' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/events/event-1');

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/events?view=table');

    await userEvent.click(screen.getByRole('button', { name: 'Open item' }));
    await userEvent.click(screen.getByRole('link', { name: 'Events tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/events?view=table');
  });

  test('keeps the feed once toggled back to it', async () => {
    renderAt('/events');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);

    await userEvent.click(screen.getByRole('button', { name: 'Open item' }));
    await userEvent.click(screen.getByRole('link', { name: 'Events tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);
  });

  test('lets Back undo an expand', async () => {
    renderAt('/events');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);

    await userEvent.click(screen.getByRole('button', { name: 'Open item' }));
    await userEvent.click(screen.getByRole('link', { name: 'Events tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);
  });

  test('keeps the events and patrols choices apart', async () => {
    renderAt('/events');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    await userEvent.click(screen.getByRole('link', { name: 'Patrols tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/patrols$/);

    await userEvent.click(screen.getByRole('link', { name: 'Events tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/events?view=table');
  });

  test('leaves item routes alone', () => {
    renderAt('/events/event-1?view=table');

    expect(screen.getByTestId('location')).toHaveTextContent('/events/event-1?view=table');
  });
});
