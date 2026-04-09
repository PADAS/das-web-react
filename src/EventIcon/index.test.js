import React from 'react';
import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';
import { render, waitFor } from '../test-utils';
import { svgCache } from '../DasIcon';
import EventIcon from './';

const mockSvgFetch = () =>
  jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'image/svg+xml' },
    text: () => Promise.resolve('<svg><path/></svg>'),
  });

// Two event types with different priorities
const lowPriorityType = { value: 'low_event', icon_id: 'low_icon', default_priority: 0 };
const highPriorityType = { value: 'high_event', icon_id: 'high_icon', default_priority: 300 };

const store = mockStore({
  data: {
    eventTypes: [lowPriorityType, highPriorityType],
    patrolTypes: [],
  },
});

const makeCollection = (containedEvents) => ({
  is_collection: true,
  event_type: 'incident_collection_rep',
  contains: containedEvents.map((event) => ({ related_event: event })),
});

describe('EventIcon collection badge icon', () => {
  let fetchSpy;

  beforeEach(() => {
    svgCache.clear();
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(mockSvgFetch());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('shows the highest-priority contained event icon as the badge — not just the first', async () => {
    // First contained event is low priority, second is high priority.
    // The badge should show high_icon (highest priority), not low_icon (first).
    const collection = makeCollection([
      { event_type: 'low_event', priority: 0 },
      { event_type: 'high_event', priority: 300 },
    ]);

    render(
      <Provider store={store}>
        <EventIcon report={collection} />
      </Provider>
    );

    await waitFor(() => {
      const fetchedUrls = fetchSpy.mock.calls.map(([url]) => url);
      expect(fetchedUrls.some((url) => url.includes('high_icon'))).toBe(true);
      expect(fetchedUrls.some((url) => url.includes('low_icon'))).toBe(false);
    });
  });

  test('shows a badge icon for collections with more than one contained event', async () => {
    const collection = makeCollection([
      { event_type: 'low_event', priority: 0 },
      { event_type: 'high_event', priority: 300 },
    ]);

    const { container } = render(
      <Provider store={store}>
        <EventIcon report={collection} />
      </Provider>
    );

    // Should render 2 inline SVGs: one for the collection icon, one for the badge
    await waitFor(() => {
      expect(container.querySelectorAll('svg').length).toBe(2);
    });
  });
});
