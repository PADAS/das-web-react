import React, { memo } from 'react';
import { connect } from 'react-redux';

import KebabMenuIcon from '../KebabMenuIcon';
import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';

import styles from './styles.module.scss';

const PatrolListTitle = (props) => {
  const{ onPatrolJumpClick } = props;
  return <div className={styles.listHeader}>
    <div>
      <h3>Current Patrols</h3>
      <h6>00:00 to now</h6>
    </div>
    <div className={styles.headerControls}>
      <HeatmapToggleButton showLabel={false} heatmapVisible={false} />
      <TrackToggleButton showLabel={false} trackVisible={false} trackPinned={false} />
      <LocationJumpButton showLabel={false} usePatrolIcon={true} bypassLocationValidation={true}
        onClick={onPatrolJumpClick} />
      <KebabMenuIcon className={styles.kebab} />
    </div>
  </div>;
};

const mapStateToProps = ({ data: { patrolFilter } }) => ({ patrolFilter });

export default connect(mapStateToProps, null)(memo(PatrolListTitle));