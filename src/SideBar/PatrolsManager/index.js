import React, { memo } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { getCurrentIdFromURL } from '../../utils/navigation';

import NewPatrol from './NewPatrol';
import PatrolOverview from './PatrolOverview';
import PatrolsFeed from '../PatrolsFeed';

const PatrolsManager = () => {
  const { pathname } = useLocation();

  const patrolId = getCurrentIdFromURL(pathname);

  return <Routes>
    <Route element={<PatrolsFeed />} index />

    <Route path="new" element={<NewPatrol />} />

    <Route path=":patrolId" element={<PatrolOverview key={patrolId} />} />

    <Route path=":patrolId/legs/*" element={<div>Leg Manager</div>} />
  </Routes>;
};

export default memo(PatrolsManager);
