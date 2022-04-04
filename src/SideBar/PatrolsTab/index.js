import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { showPatrolDetailView } from '../../ducks/patrols';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import PatrolDetailView from '../../PatrolDetailView';

import styles from '../styles.module.scss';

const PatrolsTab = ({
  map,
  patrolResults,
  loadingPatrols,
  patrolDetailView,
  showPatrolDetailView
}) => <>
  {patrolDetailView.show && <PatrolDetailView className={styles.patrolDetailView} />}
  <PatrolFilter />
  <PatrolList
    loading={loadingPatrols}
    map={map}
    patrols={patrolResults}
    onItemClick={(id) => showPatrolDetailView({ id })}
  />
</>;

PatrolsTab.propTypes = {
  map: PropTypes.object.isRequired,
  patrolResults: PropTypes.array.isRequired,
  loadingPatrols: PropTypes.bool.isRequired,
  patrolDetailView: PropTypes.object,
  showPatrolDetailView: PropTypes.func.isRequired,
};

const mapStateToProps = ({ view: { patrolDetailView } }) => ({ patrolDetailView });

export default connect(mapStateToProps, { showPatrolDetailView })(PatrolsTab);