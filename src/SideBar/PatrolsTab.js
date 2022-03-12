import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';

import { isEqual } from 'lodash';
import { isEmpty } from 'lodash';
import { clearPatrolDetailView } from '../ducks/patrols';

import PatrolFilter from '../PatrolFilter';
import PatrolList from '../PatrolList';
import PatrolDrawer from '../PatrolDrawer';

import styles from './styles.module.scss';

const PatrolsTab = ({ loadingPatrols, map, patrolResults, nestedNavigationState, changeNestedNavigation, clearPatrolDetailView, patrolDetailView }) => {

  const [activePatrol, setActivePatrol] = useState({});
  const [showPatrolDrawer, setShowPatrolDrawer] = useState(false);

  const openPatrolDetailView = useCallback(() => {
    setShowPatrolDrawer(true);
    changeNestedNavigation(true);
  }, [changeNestedNavigation]);

  const handleItemClick = useCallback((patrolId) => {
    setActivePatrol({ id: patrolId });
    openPatrolDetailView();
  }, [openPatrolDetailView, activePatrol]);

  const handleCloseDetailView = useCallback(() => {
    setActivePatrol({});
    setShowPatrolDrawer(false);
    changeNestedNavigation(false);
    clearPatrolDetailView();
  }, [changeNestedNavigation, clearPatrolDetailView]);

  useEffect(() => {
    if (!nestedNavigationState & !isEmpty(activePatrol)) {

      handleCloseDetailView();
    }
  }, [handleCloseDetailView, nestedNavigationState, activePatrol]);

  useEffect(() => {
    if (isEmpty(activePatrol) && !isEqual(patrolDetailView, activePatrol)) {
      setActivePatrol(patrolDetailView);
      openPatrolDetailView();
    }
  }, [patrolDetailView, activePatrol, openPatrolDetailView]);

  return <>
    {showPatrolDrawer ?
      <PatrolDrawer patrolId={!!activePatrol?.id ? activePatrol.id : ''} newPatrol={!activePatrol?.id ? activePatrol : {}} className={styles.patrolDetailView} onCloseDetailView={handleCloseDetailView}/> :
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