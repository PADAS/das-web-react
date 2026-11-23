import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../../../../constants';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../../test-utils';
import { TrackerContext } from '../../../../utils/analytics';
import {
  INITIAL_STATE as INITIAL_FEED_TABLE_SORT_STATE,
  SET_FEED_TABLE_CLIENT_SORT,
} from '../../../../ducks/feed-table-sort';
import { updateEventFilter } from '../../../../ducks/event-filter';

import SortControls from './';

jest.mock('../../../../ducks/event-filter', () => ({
  ...jest.requireActual('../../../../ducks/event-filter'),
  updateEventFilter: jest.fn(),
}));

describe('SideBar - EventsManager - EventsFeed - SortControls', () => {
  let store;
  let track;

  beforeEach(() => {
    track = jest.fn();
    updateEventFilter.mockImplementation(() => () => {});

    store = {
      data: { eventFilter: { filter: { sort: DEFAULT_EVENT_SORT } } },
      view: { feedTableSort: INITIAL_FEED_TABLE_SORT_STATE },
    };
  });

  let mockedStore;

  const renderSortControls = (props = {}) => render(
    <Provider store={(mockedStore = mockStore(store))}>
      <TrackerContext.Provider value={{ track }}>
        <SortControls {...props} />
      </TrackerContext.Provider>
    </Provider>
  );

  const getSortByButton = (sortByLabel = 'Date Updated') => screen.getByRole(
    'button',
    { name: `Open sort options for events, sorted by ${sortByLabel}` }
  );

  const openSortByMenu = async (sortByLabel) => {
    await userEvent.click(getSortByButton(sortByLabel));

    return screen.findByRole('menu', { name: 'Sort options for events' });
  };

  describe('with a table sort of its own', () => {
    const titleSort = { colId: 'title', label: 'Title', sort: 'asc' };

    beforeEach(() => {
      store.view.feedTableSort = {
        ...INITIAL_FEED_TABLE_SORT_STATE,
        events: { ...INITIAL_FEED_TABLE_SORT_STATE.events, clientSort: { ...titleSort, feedSort: DEFAULT_EVENT_SORT } },
      };
    });

    const clientSortActions = () => mockedStore.getActions()
      .filter((action) => action.type === SET_FEED_TABLE_CLIENT_SORT);

    test('shows the table sort on the controls', () => {
      renderSortControls({ isTableView: true });

      expect(getSortByButton('Title')).toHaveTextContent('Title');
      expect(getSortByButton('Title')).toHaveClass('active');
      expect(screen.getByRole('button', { name: 'Sort events in descending order' })).toBeInTheDocument();
    });

    test('shows the feed sort in the list', () => {
      renderSortControls();

      expect(getSortByButton()).toHaveTextContent('Date Updated');
    });

    test('reverses the table sort', async () => {
      renderSortControls({ isTableView: true });

      await userEvent.click(screen.getByRole('button', { name: 'Sort events in descending order' }));

      expect(clientSortActions()[0].payload.clientSort).toMatchObject({ colId: 'title', sort: 'desc' });
      expect(updateEventFilter).not.toHaveBeenCalled();
    });

    test('goes back to a sort of the events API when an option is chosen', async () => {
      renderSortControls({ isTableView: true });

      const menu = await openSortByMenu('Title');
      expect(within(menu).getAllByRole('menuitemradio').some((item) => item.getAttribute('aria-checked') === 'true'))
        .toBe(false);

      await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Event Date' }));

      expect(clientSortActions()[0].payload.clientSort).toBeNull();
      expect(updateEventFilter).toHaveBeenCalledWith({ filter: { sort: [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[2]] } });
    });
  });

  test('shows the current sort option on the sort by button', () => {
    renderSortControls();

    expect(getSortByButton()).toHaveTextContent('Date Updated');
  });

  test('leaves the sort by button inactive while the default sort option is selected', () => {
    renderSortControls();

    expect(getSortByButton()).not.toHaveClass('active');
  });

  test('marks the sort by button as active while another sort option is selected', () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[2]];

    renderSortControls();

    expect(getSortByButton('Event Date')).toHaveTextContent('Event Date');
    expect(getSortByButton('Event Date')).toHaveClass('active');
  });

  test('announces that the sort by button opens a menu', () => {
    renderSortControls();

    expect(getSortByButton()).toHaveAttribute('aria-haspopup', 'menu');
    expect(getSortByButton()).toHaveAttribute('aria-expanded', 'false');
  });

  test('checks the sort option in use and focuses the menu itself when the user opens it with a click', async () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[1]];

    renderSortControls();

    const menu = await openSortByMenu('Created Date');

    expect(getSortByButton('Created Date')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Created Date' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Date Updated' })).toHaveAttribute('aria-checked', 'false');
    expect(menu).toHaveFocus();
  });

  test('focuses the first option when the user opens the sort by menu from the keyboard', async () => {
    renderSortControls();

    getSortByButton().focus();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('menuitemradio', { name: 'Date Updated' })).toHaveFocus();
  });

  test('moves the focus down the sort by menu options with the arrow down key, wrapping at the end', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitemradio', { name: 'Date Updated' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitemradio', { name: 'Created Date' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitemradio', { name: 'Date Updated' })).toHaveFocus();
  });

  test('moves the focus up the sort by menu options with the arrow up key, wrapping at the start', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitemradio', { name: 'Serial Number' })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitemradio', { name: 'Event Date' })).toHaveFocus();
  });

  test('moves the focus to the last and first sort by menu options with the end and home keys', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{End}');

    expect(screen.getByRole('menuitemradio', { name: 'Serial Number' })).toHaveFocus();

    await userEvent.keyboard('{Home}');

    expect(screen.getByRole('menuitemradio', { name: 'Date Updated' })).toHaveFocus();
  });

  test('closes the sort by menu and returns focus to its trigger when the user presses escape', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{Escape}');

    expect(getSortByButton()).toHaveAttribute('aria-expanded', 'false');
    expect(getSortByButton()).toHaveFocus();
  });

  test('closes the sort by menu when the user presses tab', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{Tab}');

    expect(getSortByButton()).toHaveAttribute('aria-expanded', 'false');
  });

  test('sorts the feed by the option the user picks, keeping the sort direction', async () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[0]];

    renderSortControls();

    await openSortByMenu();

    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Event Date' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { sort: [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[2]] } });
    expect(track).toHaveBeenCalledWith('Sort the feed by event_time');
    expect(getSortByButton()).toHaveAttribute('aria-expanded', 'false');
    expect(getSortByButton()).toHaveFocus();
  });

  test('offers to sort ascending while the feed is sorted descending', () => {
    renderSortControls();

    expect(screen.getByRole('button', { name: 'Sort events in ascending order' })).not.toHaveAttribute('aria-pressed');
  });

  test('offers to sort descending while the feed is sorted ascending, and highlights the button', () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[0]];

    renderSortControls();

    expect(screen.getByRole('button', { name: 'Sort events in descending order' })).not.toHaveAttribute('aria-pressed');
    expect(screen.getByRole('button', { name: 'Sort events in descending order' })).toHaveClass('active');
  });

  test('flips the sort direction to ascending when the user clicks the direction button', async () => {
    renderSortControls();

    await userEvent.click(screen.getByRole('button', { name: 'Sort events in ascending order' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { sort: [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[0]] } });
    expect(track).toHaveBeenCalledWith('Sort the feed in ascending order');
  });

  test('flips the sort direction to descending when the user clicks the direction button', async () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[1]];

    renderSortControls();

    await userEvent.click(screen.getByRole('button', { name: 'Sort events in descending order' }));

    expect(updateEventFilter).toHaveBeenCalledWith({
      filter: { sort: [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[1]] },
    });
    expect(track).toHaveBeenCalledWith('Sort the feed in descending order');
  });
});
