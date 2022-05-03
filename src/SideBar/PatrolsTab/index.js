import React, { createContext } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';

import { showDetailView } from '../../ducks/side-bar';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../constants';
import useERNavigate from '../../hooks/useERNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import PatrolDetailView from '../../PatrolDetailView';

import styles from '../styles.module.scss';

const { ENABLE_URL_NAVIGATION } = DEVELOPMENT_FEATURE_FLAGS;

export const PatrolsTabContext = createContext();

const PatrolsTab = ({
  map,
  patrolResults,
  loadingPatrols,
  showSideBarDetailView,
  sideBar,
}) => {
  const navigate= useERNavigate();

  return <>
    {ENABLE_URL_NAVIGATION
      ? <PatrolsTabContext.Provider value={{ loadingPatrols }}>
        <Outlet />
      </PatrolsTabContext.Provider>
      : sideBar.currentTab === TAB_KEYS.PATROLS && sideBar.showDetailView && <PatrolDetailView
        className={styles.patrolDetailView}
        loadingPatrols={loadingPatrols}
      />}

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
  map: PropTypes.object.isRequired,
  patrolResults: PropTypes.array.isRequired,
  loadingPatrols: PropTypes.bool.isRequired,
  sideBar: PropTypes.object,
  showSideBarDetailView: PropTypes.func.isRequired,
};

const mapStateToProps = ({ view: { sideBar } }) => ({ sideBar });

export default connect(mapStateToProps, { showSideBarDetailView: showDetailView })(PatrolsTab);