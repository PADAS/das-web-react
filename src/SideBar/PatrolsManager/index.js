import React, { memo } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { getCurrentIdFromURL } from '../../utils/navigation';

import LegManager from './LegManager';
import NewPatrol from './NewPatrol';
import PatrolOverview from './PatrolOverview';
import PatrolsFeed from '../PatrolsFeed';

const PatrolsManager = () => {
  const { pathname } = useLocation();

  const patrolId = getCurrentIdFromURL(pathname);

  return <Routes>
    <Route element={<PatrolsFeed />} index />

    <Route element={<NewPatrol />} path="new" />

    <Route element={<PatrolOverview key={patrolId} />} path=":patrolId" />

    <Route element={<LegManager key={patrolId} />} path=":patrolId/legs/*" />
  </Routes>;
};

export default memo(PatrolsManager);
