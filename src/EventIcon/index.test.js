import React from 'react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';
import { render, waitFor } from '../test-utils';
import { svgCache } from '../SvgIcon';
import EventIcon from './';

const mockSvgAxios = () =>
  jest.fn().mockResolvedValue({
    data: '<svg><path/></svg>',
    headers: { 'content-type': 'image/svg+xml' },
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
  event_type: 'incident_collection',
  contains: containedEvents.map((event) => ({ related_event: event })),
});

describe('EventIcon collection badge icon', () => {
  let axiosSpy;

  beforeEach(() => {
    svgCache.clear();
    axiosSpy = jest.spyOn(axios, 'get').mockImplementation(mockSvgAxios());
  });

  afterEach(() => {
    axiosSpy.mockRestore();
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
      const fetchedUrls = axiosSpy.mock.calls.map(([url]) => url);
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

  test('gives the collection wrapper the translated collection tooltip', async () => {
    const collection = makeCollection([
      { event_type: 'low_event', priority: 0 },
      { event_type: 'high_event', priority: 300 },
    ]);

    const { container } = render(
      <Provider store={store}>
        <EventIcon report={collection} />
      </Provider>
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg').length).toBe(2);
    });
    expect(container.querySelector('span[title="Collection"]')).toBeInTheDocument();
  });
});

describe('EventIcon accessible name', () => {
  let axiosSpy;

  beforeEach(() => {
    svgCache.clear();
    axiosSpy = jest.spyOn(axios, 'get').mockImplementation(mockSvgAxios());
  });

  afterEach(() => {
    axiosSpy.mockRestore();
  });

  test('exposes the event type display title, not the raw slug', async () => {
    const displayStore = mockStore({
      data: {
        eventTypes: [{ value: 'carcass_rep', icon_id: 'carcass_icon', display: 'Carcass' }],
        patrolTypes: [],
      },
    });

    const { container } = render(
      <Provider store={displayStore}>
        <EventIcon report={{ event_type: 'carcass_rep' }} />
      </Provider>
    );

    await waitFor(() => {
      expect(container.querySelector('[role="img"]')).toBeInTheDocument();
    });
    const icon = container.querySelector('[role="img"]');
    expect(icon).toHaveAttribute('aria-label', 'Carcass');
    expect(icon).not.toHaveAttribute('aria-label', 'carcass_rep');
  });
});
