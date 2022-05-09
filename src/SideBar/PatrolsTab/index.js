import React, { createContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Outlet, useLocation } from 'react-router-dom';

import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../constants';
import { fetchPatrol } from '../../ducks/patrols';
import { getCurrentIdFromURL } from '../../utils/navigation';
import { showDetailView } from '../../ducks/side-bar';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import PatrolDetailView from '../../PatrolDetailView';

import styles from '../styles.module.scss';

const { ENABLE_URL_NAVIGATION } = DEVELOPMENT_FEATURE_FLAGS;

export const PatrolsTabContext = createContext();

const PatrolsTab = ({
  fetchPatrol,
  map,
  patrolStore,
  patrolResults,
  loadingPatrols: loadingPatrolFeed,
  showSideBarDetailView,
  sideBar,
}) => {
  const location= useLocation();
  const navigate= useNavigate();

  const [loadingPatrolById, setLoadingPatrolById] = useState(true);

  const itemId = useMemo(() => getCurrentIdFromURL(location.pathname), [location.pathname]);

  useEffect(() => {
    if (itemId && !patrolStore[itemId]) {
      setLoadingPatrolById(true);
      fetchPatrol(itemId)
        .then(() => setLoadingPatrolById(false))
        .catch(() => navigate(`/${TAB_KEYS.PATROLS}`, { replace: true }));
    } else if (!itemId) {
      setLoadingPatrolById(false);
    }
  }, [fetchPatrol, itemId, navigate, patrolStore]);

  const loadingPatrols = !!itemId ? loadingPatrolById : loadingPatrolFeed;
  return <>
    {ENABLE_URL_NAVIGATION
      ? <PatrolsTabContext.Provider value={{ loadingPatrols }}>
        <Outlet />
      </PatrolsTabContext.Provider>
      : sideBar.currentTab === TAB_KEYS.PATROLS && sideBar.showDetailView && <div data-testid="patrolDetailViewContainer">
        <PatrolDetailView
          className={styles.patrolDetailView}
          loadingPatrols={loadingPatrols}
        />
      </div>}

    <PatrolFilter />
    <PatrolList
      loading={loadingPatrols}
      map={map}
      patrols={patrolResults}
      onItemClick={(id) => ENABLE_URL_NAVIGATION
        ? navigate(id)
        : showSideBarDetailView(TAB_KEYS.PATROLS, { id })}
    />
  </>;
};

PatrolsTab.propTypes = {
  fetchPatrol: PropTypes.func.isRequired,
  map: PropTypes.object.isRequired,
  patrolStore: PropTypes.object.isRequired,
  patrolResults: PropTypes.array.isRequired,
  loadingPatrols: PropTypes.bool.isRequired,
  sideBar: PropTypes.object,
  showSideBarDetailView: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  patrolStore: state.data.patrolStore,
  sideBar: state.view.sideBar,
});

export default connect(mapStateToProps, { fetchPatrol, showSideBarDetailView: showDetailView })(PatrolsTab);