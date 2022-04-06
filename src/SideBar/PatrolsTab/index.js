import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { showDetailView } from '../../ducks/vertical-navigation-bar';
import { TAB_KEYS } from '../../constants';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import PatrolDetailView from '../../PatrolDetailView';

import styles from '../styles.module.scss';

const PatrolsTab = ({
  map,
  patrolResults,
  loadingPatrols,
  showVerticalNavigationBarDetailView,
  verticalNavigationBar,
}) => <>
  {verticalNavigationBar.currentTab === TAB_KEYS.PATROLS && verticalNavigationBar.showDetailView &&
    <PatrolDetailView className={styles.patrolDetailView} />}
  <PatrolFilter />
  <PatrolList
    loading={loadingPatrols}
    map={map}
    patrols={patrolResults}
    onItemClick={(id) => showVerticalNavigationBarDetailView(TAB_KEYS.PATROLS, { id })}
  />
</>;

PatrolsTab.propTypes = {
  map: PropTypes.object.isRequired,
  patrolResults: PropTypes.array.isRequired,
  loadingPatrols: PropTypes.bool.isRequired,
  verticalNavigationBar: PropTypes.object,
  showVerticalNavigationBarDetailView: PropTypes.func.isRequired,
};

const mapStateToProps = ({ view: { verticalNavigationBar } }) => ({ verticalNavigationBar });

export default connect(mapStateToProps, { showVerticalNavigationBarDetailView: showDetailView })(PatrolsTab);