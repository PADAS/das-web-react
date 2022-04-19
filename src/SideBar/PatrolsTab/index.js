import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { showDetailView } from '../../ducks/side-bar';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../constants';
import { useLocationParameters, useNavigate } from '../../hooks/navigation';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import PatrolDetailView from '../../PatrolDetailView';

import styles from '../styles.module.scss';

const { ENABLE_URL_NAVIGATION } = DEVELOPMENT_FEATURE_FLAGS;

const PatrolsTab = ({
  map,
  patrolResults,
  loadingPatrols,
  showSideBarDetailView,
  sideBar,
}) => {
  const navigate= useNavigate();
  const { itemId, tab } = useLocationParameters();
  const currentTab = ENABLE_URL_NAVIGATION ? tab : sideBar.currentTab;
  const showDetailView = ENABLE_URL_NAVIGATION ? !!itemId : sideBar.showDetailView;

  return <>
    {currentTab === TAB_KEYS.PATROLS && showDetailView &&
      <PatrolDetailView className={styles.patrolDetailView} loadingPatrols={loadingPatrols} />}
    <PatrolFilter />
    <PatrolList
      loading={loadingPatrols}
      map={map}
      patrols={patrolResults}
      onItemClick={(id) => ENABLE_URL_NAVIGATION
        ? navigate(TAB_KEYS.PATROLS, id)
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