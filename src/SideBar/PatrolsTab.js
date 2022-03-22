import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { isEqual } from 'lodash';
import { isEmpty } from 'lodash';
import { clearPatrolDetailView } from '../ducks/patrols';

import PatrolFilter from '../PatrolFilter';
import PatrolList from '../PatrolList';
import PatrolDetailView from '../PatrolDetailView';

import styles from './styles.module.scss';


const PatrolsTab = ({ map, patrolResults, loadingPatrols, changeNestedNavigation, nestedNavigationState = false, clearPatrolDetailView, patrolDetailView }) => {
  const [activePatrol, setActivePatrol] = useState({});
  const [showPatrolDetailView, setShowPatrolDetailView] = useState(false);

  const openPatrolDetailView = useCallback(() => {
    setShowPatrolDetailView(true);
    changeNestedNavigation(true);
  }, [changeNestedNavigation]);

  const handleItemClick = useCallback((patrolId) => {
    setActivePatrol({ id: patrolId });
    openPatrolDetailView();
  }, [openPatrolDetailView]);

  const handleCloseDetailView = useCallback(() => {
    setShowPatrolDetailView(false);
    clearPatrolDetailView();
    changeNestedNavigation(false);
    setActivePatrol({});

  }, [changeNestedNavigation, clearPatrolDetailView]);

  useEffect(() => {
    if (showPatrolDetailView){
      if (!nestedNavigationState & !isEmpty(activePatrol)) {
        handleCloseDetailView();
      }
    }
  }, [handleCloseDetailView, nestedNavigationState, activePatrol, showPatrolDetailView]);

  useEffect(() => {
    if (isEmpty(activePatrol) && !isEqual(patrolDetailView, activePatrol)) {
      setActivePatrol(patrolDetailView);
      openPatrolDetailView();
    }
  }, [patrolDetailView, activePatrol, openPatrolDetailView]);

  return <>
    {showPatrolDetailView ?
      <PatrolDetailView
        className={styles.patrolDetailView}
        patrolId={!!activePatrol?.id ? activePatrol.id : ''}
        newPatrol={!activePatrol?.id ? activePatrol : {}}
        onCloseDetailView={handleCloseDetailView}/> :
      (<>
        <PatrolFilter />
        <PatrolList loading={loadingPatrols} map={map} patrols={patrolResults} onItemClick={handleItemClick} />
      </>)
    }
  </>;
};

PatrolsTab.propTypes = {
  map: PropTypes.object.isRequired,
  patrolResults: PropTypes.array.isRequired,
  loadingPatrols: PropTypes.bool.isRequired,
  nestedNavigationState: PropTypes.bool,
  changeNestedNavigation: PropTypes.func,
  clearPatrolDetailView: PropTypes.func,
  patrolDetailView: PropTypes.object,
};

const mapStateToProps = ({ view: { patrolDetailView } }) => ({ patrolDetailView });

export default connect(mapStateToProps, { clearPatrolDetailView })(PatrolsTab);