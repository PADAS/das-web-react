import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { showDetailView } from '../../ducks/side-bar';
import { TAB_KEYS } from '../../constants';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import PatrolDetailView from '../../PatrolDetailView';

import styles from '../styles.module.scss';

const PatrolsTab = ({
  map,
  patrolResults,
  loadingPatrols,
  showSideBarDetailView,
  sideBar,
}) => <>
  {sideBar.currentTab === TAB_KEYS.PATROLS && sideBar.showDetailView &&
    <PatrolDetailView className={styles.patrolDetailView} />}
  <PatrolFilter />
  <PatrolList
    loading={loadingPatrols}
    map={map}
    patrols={patrolResults}
    onItemClick={(id) => showSideBarDetailView(TAB_KEYS.PATROLS, { id })}
  />
</>;

PatrolsTab.propTypes = {
  map: PropTypes.object.isRequired,
  patrolResults: PropTypes.array.isRequired,
  loadingPatrols: PropTypes.bool.isRequired,
  sideBar: PropTypes.object,
  showSideBarDetailView: PropTypes.func.isRequired,
};

const mapStateToProps = ({ view: { sideBar } }) => ({ sideBar });

export default connect(mapStateToProps, { showSideBarDetailView: showDetailView })(PatrolsTab);