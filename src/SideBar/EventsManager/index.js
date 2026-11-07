import { Route, Routes, useLocation } from 'react-router';

import { FEED_CATEGORY, TrackerContext, trackEventFactory } from '../../utils/analytics';
import { getCurrentIdFromURL } from '../../utils/navigation';

import EventOverview from './EventOverview';
import EventsFeed from './EventsFeed';

const eventsFeedTracker = trackEventFactory(FEED_CATEGORY);

const EventsManager = ({ eventsFeed }) => {
  const { pathname } = useLocation();

  const eventId = getCurrentIdFromURL(pathname);

  return <Routes>
    <Route
      element={<TrackerContext.Provider value={eventsFeedTracker}>
        <EventsFeed eventsFeed={eventsFeed} />
      </TrackerContext.Provider>}
      index
    />

    <Route element={<EventOverview key={eventId} />} path=":eventId/*" />
  </Routes>;
};

export default EventsManager;
