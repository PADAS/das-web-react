import { Link, useLocation, useNavigate as useRouterNavigate } from 'react-router';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';

import useFeedTableView, { useRestoreFeedTableView } from './useFeedTableView';

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

const savedChoice = (tab) => JSON.parse(window.localStorage.getItem(`feedTableView.${tab}`));
const saveChoice = (tab, isTableView) => window.localStorage.setItem(`feedTableView.${tab}`, JSON.stringify(isTableView));

describe('useFeedTableView', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('restores the saved table view on a refresh', () => {
    saveChoice('events', true);

    renderAt('/events');

    expect(screen.getByTestId('location')).toHaveTextContent('/events?view=table');
    expect(screen.getByTestId('view')).toHaveTextContent('table');
  });

  test('stays on the feed without a saved choice', () => {
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
    saveChoice('events', true);
    renderAt('/events');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);
    expect(savedChoice('events')).toBe(false);

    await userEvent.click(screen.getByRole('link', { name: 'Events tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);
  });

  test('lets Back undo an expand', async () => {
    renderAt('/events');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);
    expect(savedChoice('events')).toBe(false);
  });

  test('takes the view from the URL over the saved choice, and saves it', () => {
    saveChoice('events', false);

    renderAt('/events?view=table');

    expect(screen.getByTestId('view')).toHaveTextContent('table');
    expect(savedChoice('events')).toBe(true);
  });

  test('keeps the events and patrols choices apart', async () => {
    saveChoice('events', true);
    renderAt('/patrols');

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/patrols$/);

    await userEvent.click(screen.getByRole('link', { name: 'Events tab' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/events?view=table');
    expect(savedChoice('patrols')).toBeNull();
  });

  test('leaves item routes alone', () => {
    saveChoice('events', true);

    renderAt('/events/event-1');

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events\/event-1$/);
  });

  test('treats unreadable storage as no saved choice', () => {
    window.localStorage.setItem('feedTableView.events', '{not json');

    renderAt('/events');

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/events$/);
  });
});
