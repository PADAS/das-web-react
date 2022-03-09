import React, { useState, useEffect, useCallback, memo } from 'react';
import { connect } from 'react-redux';

import { isEmpty } from 'lodash';
import { showPatrolDetailView, clearPatrolDetailView } from '../ducks/patrols';

import PatrolFilter from '../PatrolFilter';
import PatrolList from '../PatrolList';
import PatrolDrawer from '../PatrolDrawer';

import styles from './styles.module.scss';

const PatrolsTab = ({ loadingPatrols, map, patrolResults, nestedNavigationState, changeNestedNavigation, patrolDetailView, showPatrolDetailView, clearPatrolDetailView }) => {

  const [selectedPatrol, setSelectedPatrol] = useState('');
  const [showPatrolDrawer, setShowPatrolDrawer] = useState(false);

  const openPatrolDetailView = useCallback((patrolId = '') => {
    setSelectedPatrol(patrolId);
    setShowPatrolDrawer(true);
    changeNestedNavigation(true);
    console.log('%c openPatrolDetailView!', 'font-size:20px;color:yellow;');
  }, [changeNestedNavigation]);

  const handleCloseDetailView = useCallback(() => {
    setSelectedPatrol('');
    setShowPatrolDrawer(false);
    changeNestedNavigation(false);
    clearPatrolDetailView();
    console.log('%c handleCloseDetailView!', 'font-size:20px;color:orange;');
  }, [changeNestedNavigation, clearPatrolDetailView]);

  useEffect(() => {
    console.log('%c nestedNavigationState!', 'font-size:20px;color:white;', nestedNavigationState);
    if (!nestedNavigationState) return handleCloseDetailView();

  }, [handleCloseDetailView, nestedNavigationState]);

  useEffect(() => {
    if (!!patrolDetailView?.patrolId.length){
      console.log('%c isOpen!', 'font-size:20px;color:red;');
      openPatrolDetailView(patrolDetailView.patrolId);
    }

    if (!isEmpty(patrolDetailView?.newPatrol)){
      openPatrolDetailView();
    }
  }, [patrolDetailView, openPatrolDetailView]);

  return <>
    {showPatrolDrawer ? <PatrolDrawer patrolId={selectedPatrol} newPatrol={patrolDetailView?.newPatrol ?? {}} className={styles.patrolDetailView} onCloseDetailView={handleCloseDetailView}/> :
      (<>
        <PatrolFilter />
        <PatrolList loading={loadingPatrols} map={map} patrols={patrolResults} onItemClick={(id) => showPatrolDetailView({ patrolId: id })} />
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

export default connect(mapStateToProps, { showPatrolDetailView, clearPatrolDetailView })(memo(PatrolsTab));