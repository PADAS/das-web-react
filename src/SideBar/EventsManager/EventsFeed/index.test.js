import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION, TAB_KEYS } from '../../../constants';
import { fetchNextEventFeedPage } from '../../../ducks/events';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../test-utils';
import { report } from '../../../__test-helpers/fixtures/reports';
import { SidebarScrollProvider } from '../../../SidebarScrollContext';

import EventsFeed from './';

jest.mock('../../../ducks/events', () => ({
  ...jest.requireActual('../../../ducks/events'),
  fetchNextEventFeedPage: jest.fn(),
}));

/* eslint-disable-next-line react/display-name */
jest.mock('./Filters', () => ({ resultCount }) => <div>{`${resultCount} results`}</div>);

/* eslint-disable-next-line react/display-name */
jest.mock('./EventRow', () => ({ displayTimeProp, event }) => <li>
  {`#${event.serial_number} by ${displayTimeProp}`}
</li>);

describe('SideBar - EventsManager - EventsFeed', () => {
  let collection;
  let eventsFeed;
  let firstEvent;
  let secondEvent;
  let thirdEvent;

  beforeEach(() => {
    fetchNextEventFeedPage.mockImplementation(() => () => {});

    firstEvent = {
      ...report,
      created_at: '2022-04-03T10:00:00Z',
      id: 'first',
      serial_number: 1,
      updated_at: '2022-04-01T10:00:00Z',
    };
    secondEvent = {
      ...report,
      created_at: '2022-04-01T10:00:00Z',
      id: 'second',
      serial_number: 2,
      updated_at: '2022-04-03T10:00:00Z',
    };
    thirdEvent = {
      ...report,
      created_at: '2022-04-02T10:00:00Z',
      id: 'third',
      serial_number: 3,
      updated_at: '2022-04-02T10:00:00Z',
    };
    collection = {
      ...report,
      contains: [{ related_event: { id: secondEvent.id } }],
      id: 'collection',
      is_collection: true,
      serial_number: 4,
      updated_at: '2022-04-04T10:00:00Z',
    };

    eventsFeed = {
      events: { count: 3, error: null, next: null, results: [firstEvent, secondEvent, thirdEvent] },
      feedSort: DEFAULT_EVENT_SORT,
      loadFeedEvents: jest.fn(),
      loadingEventFeed: false,
      shouldExcludeContained: false,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderEventsFeed = (eventsFeedOverrides) => render(
    <Provider store={mockStore({ data: {}, view: {} })}>
      <SidebarScrollProvider>
        <EventsFeed eventsFeed={{ ...eventsFeed, ...eventsFeedOverrides }} />
      </SidebarScrollProvider>
    </Provider>,
    { initialEntries: [`/${TAB_KEYS.EVENTS}`] }
  );

  const getEventRowTexts = () => within(screen.getByRole('list', { name: 'Event list' }))
    .getAllByRole('listitem')
    .map((eventRow) => eventRow.textContent);

  test('passes the event count to the filters', () => {
    renderEventsFeed();

    expect(screen.getByText('3 results')).toBeVisible();
  });

  test('passes a zero count to the filters when the feed has no count yet', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, count: undefined } });

    expect(screen.getByText('0 results')).toBeVisible();
  });

  test('shows a loading status while the feed is loading', () => {
    renderEventsFeed({ loadingEventFeed: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading events');
    expect(screen.queryByRole('list', { name: 'Event list' })).toBeNull();
  });

  test('shows an error message when the feed could not be loaded', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, error: 'Network error' } });

    expect(screen.getByText('Could not load events. Please try again.')).toBeVisible();
    expect(screen.queryByRole('list', { name: 'Event list' })).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('shows the error message instead of the loading status when both are set', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, error: 'Network error' }, loadingEventFeed: true });

    expect(screen.getByText('Could not load events. Please try again.')).toBeVisible();
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('reloads the feed without arguments when the user clicks the try again button', async () => {
    renderEventsFeed({ events: { ...eventsFeed.events, error: 'Network error' } });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(eventsFeed.loadFeedEvents).toHaveBeenCalledTimes(1);
    expect(eventsFeed.loadFeedEvents).toHaveBeenCalledWith();
  });

  test('shows an empty state when there are no events', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, count: 0, results: [] } });

    expect(screen.getByText('No events to display.')).toBeVisible();
    expect(screen.queryByRole('list', { name: 'Event list' })).toBeNull();
  });

  test('shows an empty state when the feed has no results yet', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, results: undefined } });

    expect(screen.getByText('No events to display.')).toBeVisible();
  });

  test('lists one row per event, most recently updated first by default', () => {
    renderEventsFeed();

    expect(getEventRowTexts()).toEqual(['#2 by updated_at', '#3 by updated_at', '#1 by updated_at']);
  });

  test('lists the events in the order of the sort the feed is given', () => {
    renderEventsFeed({ feedSort: [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[1]] });

    expect(getEventRowTexts()).toEqual(['#1 by created_at', '#3 by created_at', '#2 by created_at']);
  });

  test('shows the event time on the rows when sorted by event time', () => {
    renderEventsFeed({ feedSort: [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[2]] });

    expect(getEventRowTexts()).toContain('#1 by time');
  });

  test('leaves out the events a collection contains when asked to exclude them', () => {
    renderEventsFeed({
      events: { ...eventsFeed.events, results: [firstEvent, secondEvent, collection] },
      shouldExcludeContained: true,
    });

    expect(getEventRowTexts()).toEqual(['#4 by updated_at', '#1 by updated_at']);
  });

  test('leaves out the events that belong to a collection outside the feed when asked to exclude them', () => {
    thirdEvent.is_contained_in = [{ related_event: { id: 'other-collection' } }];

    renderEventsFeed({ shouldExcludeContained: true });

    expect(getEventRowTexts()).toEqual(['#2 by updated_at', '#1 by updated_at']);
  });

  test('keeps the contained events when not asked to exclude them', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, results: [firstEvent, secondEvent, collection] } });

    expect(getEventRowTexts()).toHaveLength(3);
  });

  test('shows a loading more item when there is a next page', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, next: 'https://example.com/events?page=2' } });

    expect(screen.getByText('Loading more events...')).toBeVisible();
  });

  test('loads the next page once the list is scrolled to its end', () => {
    jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function () {
      return this.parentNode;
    });

    renderEventsFeed({ events: { ...eventsFeed.events, next: 'https://das/events?page=2' } });

    expect(fetchNextEventFeedPage).toHaveBeenCalledWith('https://das/events?page=2');
  });

  test('does not show a loading more item without a next page', () => {
    renderEventsFeed();

    expect(screen.queryByText('Loading more events...')).toBeNull();
  });
});
