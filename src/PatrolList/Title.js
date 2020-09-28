import React, { memo } from 'react';
import { connect } from 'react-redux';

import KebabMenuIcon from '../KebabMenuIcon';
import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';
import PatrolJumpButton from '../PatrolJumpButton';

import styles from './styles.module.scss';

const PatrolListTitle = (props) => {
  return <div className={styles.listHeader}>
    <div>
      <h3>Current Patrols</h3>
      <h6>00:00 to now</h6>
    </div>
    <div className={styles.headerControls}>
      <HeatmapToggleButton showLabel={false} heatmapVisible={false} />
      <TrackToggleButton showLabel={false} trackVisible={false} trackPinned={false} />
      <PatrolJumpButton showLabel={false} />
      <KebabMenuIcon className={styles.kebab} />
    </div>
  </div>;
};

const mapStateToProps = ({ data: { patrolFilter } }) => ({ patrolFilter });

export default connect(mapStateToProps, null)(memo(PatrolListTitle));