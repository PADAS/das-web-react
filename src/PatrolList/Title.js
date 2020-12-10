import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';

import { calcPatrolListTitleFromFilter, isDateFilterModified } from '../utils/patrol-filter';

import KebabMenuIcon from '../KebabMenuIcon';
import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import { ReactComponent as PatrolMarkerIcon } from '../common/images/icons/multi-patrol-marker.svg';

import styles from './styles.module.scss';

const PatrolListTitle = (props) => {
  const { onPatrolJumpClick, patrolFilter } = props;
  
  const dateRangeModified = useMemo(() => isDateFilterModified(patrolFilter), [patrolFilter]);
  const textContext = useMemo(() => calcPatrolListTitleFromFilter(patrolFilter), [patrolFilter]);

  return <div className={`${styles.listHeader} ${dateRangeModified ? styles.modified : ''}`}>
    <div>
      <h3>{textContext.title}</h3>
      <h6>{textContext.details}</h6>
    </div>
    {/*  <div className={styles.headerControls}>
      <HeatmapToggleButton showLabel={false} heatmapVisible={false} />
      <TrackToggleButton showLabel={false} trackVisible={false} trackPinned={false} />
      <LocationJumpButton iconOverride={<PatrolMarkerIcon />} bypassLocationValidation={true}
        className={styles.patrolButton} onClick={onPatrolJumpClick} />
      <KebabMenuIcon className={styles.kebab} />
    </div> */}
  </div>;
};

const mapStateToProps = ({ data: { patrolFilter } }) => ({ patrolFilter });

export default connect(mapStateToProps, null)(memo(PatrolListTitle));