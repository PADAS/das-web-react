import React from 'react';

import PatrolFilter from '../PatrolFilter';
import PatrolList from '../PatrolList';

const PatrolsTab = ({ loadingPatrols, map, patrolResults }) => (
  <>
    <PatrolFilter />
    <PatrolList loading={loadingPatrols} map={map} patrols={patrolResults} />
  </>
);

export default PatrolsTab;
