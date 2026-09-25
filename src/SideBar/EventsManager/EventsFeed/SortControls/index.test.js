import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../../../../constants';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { render, screen } from '../../../../test-utils';
import { TrackerContext } from '../../../../utils/analytics';
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

    store = { data: { eventFilter: { filter: { sort: DEFAULT_EVENT_SORT } } } };
  });

  const renderSortControls = () => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track }}>
        <SortControls />
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

  test('focuses the checked option when the user opens the sort by menu', async () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[1]];

    renderSortControls();

    await openSortByMenu('Created Date');

    expect(getSortByButton('Created Date')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Created Date' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Created Date' })).toHaveFocus();
    expect(screen.getByRole('menuitemradio', { name: 'Date Updated' })).toHaveAttribute('aria-checked', 'false');
  });

  test('moves the focus down the sort by menu options with the arrow down key, wrapping at the end', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitemradio', { name: 'Created Date' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitemradio', { name: 'Date Updated' })).toHaveFocus();
  });

  test('moves the focus up the sort by menu options with the arrow up key, wrapping at the start', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitemradio', { name: 'Event Date' })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitemradio', { name: 'Created Date' })).toHaveFocus();
  });

  test('moves the focus to the last and first sort by menu options with the end and home keys', async () => {
    renderSortControls();

    await openSortByMenu();

    await userEvent.keyboard('{End}');

    expect(screen.getByRole('menuitemradio', { name: 'Event Date' })).toHaveFocus();

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
