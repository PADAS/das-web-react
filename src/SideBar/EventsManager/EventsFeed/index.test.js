import { createRef } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import {
  DEFAULT_EVENT_SORT,
  EVENT_LINK_TARGET_TYPES,
  EVENT_SORT_OPTIONS,
  SORT_DIRECTION,
  TAB_KEYS,
} from '../../../constants';
import { fetchNextEventFeedPage, removeEventFromIncident, removeEventFromPatrol } from '../../../ducks/events';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen, waitFor, within } from '../../../test-utils';
import { report } from '../../../__test-helpers/fixtures/reports';
import { SidebarScrollContext, SidebarScrollProvider } from '../../../SidebarScrollContext';
import { TrackerContext } from '../../../utils/analytics';

import EventsFeed from './';

jest.mock('../../../ducks/events', () => ({
  ...jest.requireActual('../../../ducks/events'),
  fetchNextEventFeedPage: jest.fn(),
  removeEventFromIncident: jest.fn(),
  removeEventFromPatrol: jest.fn(),
}));

jest.mock('../../../LinkEventModal', () => {
  const React = jest.requireActual('react');

  const LinkEventModal = ({ event, onExited, onHide, show, type }) => {
    React.useEffect(() => {
      if (!show) {
        onExited();
      }
    }, [onExited, show]);

    React.useEffect(() => {
      const onKeyDown = (keyboardEvent) => keyboardEvent.key === 'Escape' && onHide();
      globalThis.document.addEventListener('keydown', onKeyDown);

      return () => globalThis.document.removeEventListener('keydown', onKeyDown);
    }, [onHide]);

    return show && <div aria-label={`Add #${event.serial_number} to ${type}`} role="dialog">
      <button onClick={onHide} type="button">Close</button>
    </div>;
  };

  return LinkEventModal;
});

jest.mock('../../../EventFilter', () => {
  const EventFilter = ({ children, isSortable }) => <div data-sortable={isSortable} data-testid="eventFilter">
    {children}
  </div>;

  return EventFilter;
});

jest.mock('./SortControls', () => {
  const SortControls = () => <button type="button">Sort</button>;

  return SortControls;
});

jest.mock('./EventRow', () => {
  const EventRow = ({
    displayTimeProp,
    event,
    isChangingLinks,
    onOpenLinkModal,
    onRemoveFromIncident,
    onRemoveFromPatrol,
  }) => <li aria-busy={isChangingLinks}>
    {`#${event.serial_number} by ${displayTimeProp}`}

    <button
      aria-label={`Add #${event.serial_number} to incident`}
      onClick={() => onOpenLinkModal('incident', event)}
      type="button"
    />

    <button
      aria-label={`Remove #${event.serial_number} from incident`}
      onClick={() => onRemoveFromIncident(event)}
      type="button"
    />

    <button
      aria-label={`Remove #${event.serial_number} from patrol`}
      onClick={() => onRemoveFromPatrol(event)}
      type="button"
    />
  </li>;

  return EventRow;
});

describe('SideBar - EventsManager - EventsFeed', () => {
  let collection;
  let eventsFeed;
  let firstEvent;
  let secondEvent;
  let thirdEvent;

  let tracker;

  beforeEach(() => {
    fetchNextEventFeedPage.mockImplementation(() => () => {});
    removeEventFromIncident.mockImplementation(() => () => Promise.resolve());
    removeEventFromPatrol.mockImplementation(() => () => Promise.resolve());
    tracker = { track: jest.fn() };

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

  const renderEventsFeed = (eventsFeedOverrides) => {
    const store = mockStore({ data: { eventCategories: {}, eventTypes: [], user: {} }, view: { systemConfig: {} } });
    const renderEventsFeedElement = (overrides) => <Provider store={store}>
      <TrackerContext.Provider value={tracker}>
        <SidebarScrollProvider>
          <EventsFeed eventsFeed={{ ...eventsFeed, ...overrides }} />
        </SidebarScrollProvider>
      </TrackerContext.Provider>
    </Provider>;

    const renderResult = render(renderEventsFeedElement(eventsFeedOverrides), {
      initialEntries: [`/${TAB_KEYS.EVENTS}`],
    });

    return {
      ...renderResult,
      rerenderEventsFeed: (overrides) => renderResult.rerender(renderEventsFeedElement(overrides)),
    };
  };

  const getEventRowTexts = () => within(screen.getByRole('list', { name: 'Event list' }))
    .getAllByRole('listitem')
    .map((eventRow) => eventRow.textContent);

  test('renders the sort controls inside a sortable event filter', () => {
    renderEventsFeed();

    expect(screen.getByTestId('eventFilter')).toHaveAttribute('data-sortable', 'true');
    expect(within(screen.getByTestId('eventFilter')).getByRole('button', { name: 'Sort' })).toBeVisible();
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

  test('shows a loading more spinner when there is a next page', () => {
    renderEventsFeed({ events: { ...eventsFeed.events, next: 'https://example.com/events?page=2' } });

    expect(screen.getByRole('status')).toHaveTextContent('Loading more events');
  });

  test('loads the next page once the list is scrolled to its end', () => {
    jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function () {
      return this.parentNode;
    });

    renderEventsFeed({ events: { ...eventsFeed.events, next: 'https://das/events?page=2' } });

    expect(fetchNextEventFeedPage).toHaveBeenCalledWith('https://das/events?page=2');
  });

  test('hands its scroll container to the sidebar, which keeps its scroll position', () => {
    const scrollContext = { scrollRef: createRef(), scrollToLastPosition: jest.fn(), setScrollPosition: jest.fn() };
    const store = mockStore({ data: { eventCategories: {}, eventTypes: [], user: {} }, view: { systemConfig: {} } });
    render(<Provider store={store}>
      <TrackerContext.Provider value={tracker}>
        <SidebarScrollContext.Provider value={scrollContext}>
          <EventsFeed eventsFeed={eventsFeed} />
        </SidebarScrollContext.Provider>
      </TrackerContext.Provider>
    </Provider>, { initialEntries: [`/${TAB_KEYS.EVENTS}`] });

    expect(scrollContext.scrollRef.current).toContainElement(screen.getByRole('list', { name: 'Event list' }));
  });

  test('does not show a loading more spinner without a next page', () => {
    renderEventsFeed();

    expect(screen.queryByRole('status')).toBeNull();
  });

  describe('linking', () => {
    const removedEvent = (event) => ({
      ...event,
      is_contained_in: [{ related_event: { id: 'incident-id' } }],
      patrols: ['patrol-id'],
    });

    test('opens one link modal for the event of the row the user picks', async () => {
      renderEventsFeed();

      await userEvent.click(screen.getByRole('button', { name: 'Add #3 to incident' }));

      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(screen.getByRole('dialog', { name: `Add #3 to ${EVENT_LINK_TARGET_TYPES.INCIDENT}` })).toBeVisible();
      expect(tracker.track).toHaveBeenCalledWith('Open the add to incident modal');
    });

    test('removes the event of a row from its incident and from its patrol', async () => {
      renderEventsFeed({ events: { ...eventsFeed.events, results: [removedEvent(firstEvent)] } });

      await userEvent.click(screen.getByRole('button', { name: 'Remove #1 from incident' }));
      await userEvent.click(screen.getByRole('button', { name: 'Remove #1 from patrol' }));

      expect(removeEventFromIncident).toHaveBeenCalledWith('first', 'incident-id');
      expect(removeEventFromPatrol).toHaveBeenCalledWith('first', 'patrol-id');
    });

    test('flags only the row whose links are changing', async () => {
      let resolveRemoval;
      removeEventFromIncident.mockImplementation(() => () => new Promise((resolve) => {
        resolveRemoval = resolve;
      }));
      renderEventsFeed({ events: { ...eventsFeed.events, results: [removedEvent(firstEvent), secondEvent] } });

      await userEvent.click(screen.getByRole('button', { name: 'Remove #1 from incident' }));

      expect(screen.getByText(/#1 by/)).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText(/#2 by/)).toHaveAttribute('aria-busy', 'false');

      resolveRemoval();

      await waitFor(() => expect(screen.getByText(/#1 by/)).toHaveAttribute('aria-busy', 'false'));
    });

    test('keeps the modal open when the row it opened from leaves the feed', async () => {
      const { rerenderEventsFeed } = renderEventsFeed();

      await userEvent.click(screen.getByRole('button', { name: 'Add #3 to incident' }));
      rerenderEventsFeed({ events: { ...eventsFeed.events, results: [firstEvent, secondEvent] } });

      expect(screen.getByRole('dialog', { name: 'Add #3 to incident' })).toBeVisible();
    });

    test('moves the focus to the event list when the modal closes after its row left the feed', async () => {
      const { rerenderEventsFeed } = renderEventsFeed();

      await userEvent.click(screen.getByRole('button', { name: 'Add #3 to incident' }));
      rerenderEventsFeed({ events: { ...eventsFeed.events, results: [firstEvent, secondEvent] } });
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.getByRole('list', { name: 'Event list' })).toHaveFocus();
    });

    test('leaves the focus alone when the modal closes while its row is still in the feed', async () => {
      renderEventsFeed();

      await userEvent.click(screen.getByRole('button', { name: 'Add #3 to incident' }));
      screen.getByRole('button', { name: 'Add #1 to incident' }).focus();
      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('button', { name: 'Add #1 to incident' })).toHaveFocus();
    });

    test('moves the focus to the event list once the row of the modal left the feed, wherever the focus is', async () => {
      const { rerenderEventsFeed } = renderEventsFeed();

      await userEvent.click(screen.getByRole('button', { name: 'Add #3 to incident' }));
      rerenderEventsFeed({ events: { ...eventsFeed.events, results: [firstEvent, secondEvent] } });
      screen.getByRole('button', { name: 'Add #1 to incident' }).focus();
      await userEvent.keyboard('{Escape}');

      expect(screen.getByRole('list', { name: 'Event list' })).toHaveFocus();
    });

    test('moves the focus to the empty state when the modal closes after the last row left the feed', async () => {
      const { rerenderEventsFeed } = renderEventsFeed();

      await userEvent.click(screen.getByRole('button', { name: 'Add #3 to incident' }));
      rerenderEventsFeed({ events: { ...eventsFeed.events, results: [] } });
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.getByText('No events to display.')).toHaveFocus();
    });
  });
});
