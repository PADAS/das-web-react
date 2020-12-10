import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';

import KebabMenuIcon from '../KebabMenuIcon';
import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import { ReactComponent as PatrolMarkerIcon } from '../common/images/icons/multi-patrol-marker.svg';

import styles from './styles.module.scss';

const PatrolListTitle = (props) => {
  const { onPatrolJumpClick, patrolFilter: { filter: { date_range } } } = props;
  
  const dateRangeModified = useMemo(() => !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range), [date_range]);

  return <div className={`${styles.listHeader} ${dateRangeModified ? styles.modified : ''}`}>
    <div>
      <h3>Current Patrols</h3>
      <h6>00:00 to now</h6>
    </div>
    <div className={styles.headerControls}>
      <HeatmapToggleButton showLabel={false} heatmapVisible={false} />
      <TrackToggleButton showLabel={false} trackVisible={false} trackPinned={false} />
      <LocationJumpButton iconOverride={<PatrolMarkerIcon />} bypassLocationValidation={true}
        className={styles.patrolButton} onClick={onPatrolJumpClick} />
      <KebabMenuIcon className={styles.kebab} />
    </div>
  </div>;
};

const mapStateToProps = ({ data: { patrolFilter } }) => ({ patrolFilter });

export default connect(mapStateToProps, null)(memo(PatrolListTitle));


const calcPatrolListTitleFromFilter = ({ filter: { date_range: { lower, upper } } }) => {
  
};
/* 
const whatever = `MMM D ${isCurrentYear ? '' : 'YYYY'}`;

const isToday
const isYesterday
const isSameMonth
const isCompleteMonth 
const isCompleteYear


is
 */