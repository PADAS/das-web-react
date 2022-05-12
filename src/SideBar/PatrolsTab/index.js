import React, { createContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Outlet, useLocation } from 'react-router-dom';

import { TAB_KEYS } from '../../constants';
import { fetchPatrol } from '../../ducks/patrols';
import { getCurrentIdFromURL } from '../../utils/navigation';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';

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
    if (itemId && itemId !== 'new' && !patrolStore[itemId]) {
      setLoadingPatrolById(true);
      fetchPatrol(itemId)
        .then(() => setLoadingPatrolById(false))
        .catch(() => navigate(`/${TAB_KEYS.PATROLS}`, { replace: true }));
    } else {
      setLoadingPatrolById(false);
    }
  }, [fetchPatrol, itemId, navigate, patrolStore]);

  const loadingPatrols = !!itemId ? loadingPatrolById : loadingPatrolFeed;
  return <>
    <PatrolsTabContext.Provider value={{ loadingPatrols }}>
      <Outlet />
    </PatrolsTabContext.Provider>

    <PatrolFilter />
    <PatrolList
      loading={loadingPatrols}
      map={map}
      patrols={patrolResults}
      onItemClick={(id) =>  navigate(id)}
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

export default connect(mapStateToProps, { fetchPatrol })(PatrolsTab);