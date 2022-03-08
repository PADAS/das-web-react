import React, { useState, useEffect } from 'react';

import PatrolFilter from '../PatrolFilter';
import PatrolList from '../PatrolList';
import PatrolDrawer from '../PatrolDrawer';

import styles from './styles.module.scss';

const PatrolsTab = ({ loadingPatrols, map, patrolResults, nestedNavigationState, changeNestedNavigation }) => {
  const [selectedPatrol, setSelectedPatrol] = useState('');
  const [showPatrolDrawer, setShowPatrolDrawer] = useState(false);

  const onItemListClick = (itemId) => {
    setSelectedPatrol(itemId);
    setShowPatrolDrawer(true);
    changeNestedNavigation(true);
  };

  const handleCloseDetailView = () => {
    setSelectedPatrol('');
    setShowPatrolDrawer(false);
    changeNestedNavigation(false);
  };

  useEffect(() => {
    if (!nestedNavigationState) setShowPatrolDrawer(false);
  }, [nestedNavigationState]);

  return <>
    {showPatrolDrawer && <PatrolDrawer patrolId={selectedPatrol} className={styles.patrolDetailView} onCloseDetailView={handleCloseDetailView}/>}
    <PatrolFilter />
    <PatrolList loading={loadingPatrols} map={map} patrols={patrolResults} onItemClick={onItemListClick}/>
  </>;
};

export default PatrolsTab;
