import React, { useState } from 'react';

import PatrolFilter from '../PatrolFilter';
import PatrolList from '../PatrolList';
import PatrolDrawer from '../PatrolDrawer';

const PatrolsTab = ({ loadingPatrols, map, patrolResults }) => {
  const [selectedPatrol, setSelectedPatrol] = useState('');
  const [showPatrolDrawer, setShowPatrolDrawer] = useState(false);

  const onItemListClick = (itemId) => {
    setSelectedPatrol(itemId);
    setShowPatrolDrawer(true);
  };

  return <>
    {showPatrolDrawer && <PatrolDrawer patrolId={selectedPatrol} className={StyleSheet.patrolDetailView}/>}
    <div className={StyleSheet.patrolsList}>
      <PatrolFilter />
      <PatrolList loading={loadingPatrols} map={map} patrols={patrolResults} onItemClick={onItemListClick}/>
    </div>
  </>;
};

export default PatrolsTab;
