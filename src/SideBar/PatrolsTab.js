import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';

import { isEmpty } from 'lodash';
import { clearPatrolDetailView } from '../ducks/patrols';

import PatrolFilter from '../PatrolFilter';
import PatrolList from '../PatrolList';
import PatrolDrawer from '../PatrolDrawer';

import styles from './styles.module.scss';

const PatrolsTab = ({ loadingPatrols, map, patrolResults, nestedNavigationState, changeNestedNavigation, patrolDetailView, clearPatrolDetailView }) => {

  const [selectedPatrolId, setSelectedPatrolId] = useState('');
  const [newPatrolData, setNewPatrolData] = useState({});
  const [showPatrolDrawer, setShowPatrolDrawer] = useState(false);

  const openPatrolDetailView = useCallback(() => {
    setShowPatrolDrawer(true);
    changeNestedNavigation(true);
  }, [changeNestedNavigation]);

  const handleItemClick = useCallback((patrolId) => {
    setSelectedPatrolId(patrolId);
    openPatrolDetailView();
  }, [openPatrolDetailView]);

  const handleCloseDetailView = useCallback(() => {
    setSelectedPatrolId('');
    setNewPatrolData({});
    setShowPatrolDrawer(false);
    changeNestedNavigation(false);
    clearPatrolDetailView();
  }, [changeNestedNavigation, clearPatrolDetailView]);

  useEffect(() => {
    //!!!!!!! inicia y hace loop porque no está nunca nesteado
    if (!nestedNavigationState & (!isEmpty(selectedPatrolId) || !isEmpty(newPatrolData))) {
      console.log('%c nestedNavigationState', 'font-size:30px;color:#006cd9;', nestedNavigationState);
      handleCloseDetailView();
    }
  }, [handleCloseDetailView, nestedNavigationState, newPatrolData, selectedPatrolId]);

  useEffect(() => {
    if (!isEmpty(patrolDetailView)) {
      console.log('%c patrolDetailView', 'font-size:30px;color:purple;', patrolDetailView);
      if (!!patrolDetailView?.id) {
        setSelectedPatrolId(patrolDetailView.id);
      } else {
        setNewPatrolData(patrolDetailView);
      }
      // console.log('%c selectedPatrolId', 'font-size:30px;color:white;', selectedPatrolId);
      console.log('%c newPatrolData', 'font-size:30px;color:red;', newPatrolData);
      openPatrolDetailView();
    }
  }, [patrolDetailView, newPatrolData, selectedPatrolId, openPatrolDetailView]);

  return <>
    {showPatrolDrawer ?
      <PatrolDrawer patrolId={selectedPatrolId} newPatrol={newPatrolData} className={styles.patrolDetailView} onCloseDetailView={handleCloseDetailView}/> :
      (<>
        <PatrolFilter />
        <PatrolList loading={loadingPatrols} map={map} patrols={patrolResults} onItemClick={handleItemClick} />
      </>)
    }
  </>;
};

// DailyReportModal.propTypes = {
//   id: PropTypes.string.isRequired,
//   removeModal: PropTypes.func.isRequired,

//   loadingPatrols
//   map
//   patrolResults
//   nestedNavigationState
//   changeNestedNavigation
//   clearPatrolDetailView
// };

const mapStateToProps = ({ view: { patrolDetailView } }) => ({ patrolDetailView });

export default connect(mapStateToProps, { clearPatrolDetailView })(PatrolsTab);