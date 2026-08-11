import React, { memo } from 'react';
import { Route, Routes } from 'react-router';

import PatrolOverview from './PatrolOverview';
import PatrolsFeed from '../PatrolsFeed';

const PatrolsManager = () => <Routes>
  <Route element={<PatrolsFeed />} index />

  <Route path="new" element={<div>New Patrol</div>} />

  <Route path=":patrolId" element={<PatrolOverview />} />

  <Route path=":patrolId/legs/*" element={<div>Leg Manager</div>} />
</Routes>;

export default memo(PatrolsManager);
