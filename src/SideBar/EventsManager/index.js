import React from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { getCurrentIdFromURL } from '../../utils/navigation';

import EventOverview from './EventOverview';
import EventsFeed from './EventsFeed';

const EventsManager = ({ eventsFeed }) => {
  const { pathname } = useLocation();

  const eventId = getCurrentIdFromURL(pathname);

  return <Routes>
    <Route element={<EventsFeed eventsFeed={eventsFeed} />} index />

    <Route element={<EventOverview key={eventId} />} path=":eventId/*" />
  </Routes>;
};

export default EventsManager;
