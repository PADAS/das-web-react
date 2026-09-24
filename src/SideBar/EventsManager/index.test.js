import React from 'react';
import { Route, Routes } from 'react-router';

import { render, screen } from '../../test-utils';

import EventsManager from './';

/* eslint-disable-next-line react/display-name */
jest.mock('./EventOverview', () => () => <div>Event Overview</div>);
/* eslint-disable-next-line react/display-name */
jest.mock('./EventsFeed', () => ({ eventsFeed }) => <div>{`Events Feed with ${eventsFeed.events.count} events`}</div>);

describe('SideBar - EventsManager', () => {
  let eventsFeed;

  beforeEach(() => {
    eventsFeed = {
      events: { count: 7, error: null, next: null, results: [] },
      loadFeedEvents: jest.fn(),
      loadingEventFeed: false,
      shouldExcludeContained: false,
    };
  });

  const renderEventsManager = (initialEntries) => render(
    <Routes>
      <Route element={<EventsManager eventsFeed={eventsFeed} />} path="events/*" />
    </Routes>,
    { initialEntries }
  );

  test('renders the events feed with the feed it is given when the path is /events', () => {
    renderEventsManager(['/events']);

    expect(screen.getByText('Events Feed with 7 events')).toBeInTheDocument();
    expect(screen.queryByText('Event Overview')).toBeNull();
  });

  test('renders the event overview when the path is /events/:eventId', () => {
    renderEventsManager(['/events/123']);

    expect(screen.getByText('Event Overview')).toBeInTheDocument();
    expect(screen.queryByText(/Events Feed/)).toBeNull();
  });

  test('renders the event overview when the path goes deeper than /events/:eventId', () => {
    renderEventsManager(['/events/123/history']);

    expect(screen.getByText('Event Overview')).toBeInTheDocument();
  });
});
