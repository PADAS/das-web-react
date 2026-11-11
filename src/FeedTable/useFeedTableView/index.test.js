import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { BREAKPOINTS } from '../../constants';
import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen } from '../../test-utils';
import { SET_FEED_TABLE_VIEW, setFeedTableView } from '../../ducks/feed-table-view';

import useFeedTableView, { useIsListReturning, useTableViewLink } from './';

const Harness = ({ tab }) => {
  const { canShowTableView, isTableView, toggleTableView } = useFeedTableView(tab);
  const isListReturning = useIsListReturning(isTableView);
  useTableViewLink();

  return <>
    <span data-testid="canShow">{canShowTableView ? 'yes' : 'no'}</span>
    <span data-testid="view">{isTableView ? 'table' : 'feed'}</span>
    <span data-testid="listReturning">{isListReturning ? 'yes' : 'no'}</span>

    <button onClick={toggleTableView} type="button">Toggle</button>
  </>;
};

describe('FeedTable - useFeedTableView', () => {
  let state, store;

  beforeEach(() => {
    state = {
      view: {
        feedTableView: { events: false, patrols: false },
      },
    };
  });

  const renderHarness = (url = '/events', tab) => {
    store = mockStore(state);

    return render(<Provider store={store}><Harness tab={tab} /></Provider>, { initialEntries: [url] });
  };

  const tableViewActions = () => store.getActions().filter((action) => action.type === SET_FEED_TABLE_VIEW);

  test('shows the table chosen for the feed in the URL', () => {
    state.view.feedTableView.patrols = true;

    renderHarness('/patrols');

    expect(screen.getByTestId('view')).toHaveTextContent('table');
  });

  test('keeps the table chosen while an item of the feed is open', () => {
    state.view.feedTableView.events = true;

    renderHarness('/events/event-id');

    expect(screen.getByTestId('view')).toHaveTextContent('table');
  });

  test('reads the feed it is given rather than the one in the URL', () => {
    state.view.feedTableView.events = true;

    renderHarness('/patrols', 'events');

    expect(screen.getByTestId('view')).toHaveTextContent('table');
  });

  test('toggles the table of the feed in the URL', async () => {
    renderHarness('/events');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(tableViewActions()).toEqual([setFeedTableView('events', true)]);
  });

  test('marks the list as returning only after the table closes', () => {
    state.view.feedTableView.events = true;
    const { rerender } = renderHarness('/events');

    expect(screen.getByTestId('listReturning')).toHaveTextContent('no');

    store = mockStore({ ...state, view: { ...state.view, feedTableView: { events: false, patrols: false } } });
    rerender(<Provider store={store}><Harness /></Provider>);

    expect(screen.getByTestId('view')).toHaveTextContent('feed');
    expect(screen.getByTestId('listReturning')).toHaveTextContent('yes');
  });

  test('cannot show the table with its feature flag turned off', () => {
    state.view.feedTableView.events = true;
    state.view.experimentalFeatures = { FEED_TABLE: false };

    renderHarness('/events');

    expect(screen.getByTestId('canShow')).toHaveTextContent('no');
    expect(screen.getByTestId('view')).toHaveTextContent('feed');
  });

  test('cannot show the table below the medium layout', () => {
    state.view.feedTableView.events = true;
    BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = false;

    renderHarness('/events');

    expect(screen.getByTestId('view')).toHaveTextContent('feed');

    BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = true;
  });

  test('cannot show the table on a tab without a feed', () => {
    renderHarness('/layers');

    expect(screen.getByTestId('canShow')).toHaveTextContent('no');
  });

  test('opens the table from a shared table link', () => {
    renderHarness('/patrols?view=table');

    expect(tableViewActions()).toEqual([setFeedTableView('patrols', true)]);
  });

  test('ignores other views in the link', () => {
    renderHarness('/patrols?view=list');

    expect(tableViewActions()).toEqual([]);
  });
});
