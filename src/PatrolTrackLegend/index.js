import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import length from '@turf/length';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import MapLegend from '../MapLegend';
import DasIcon from '../DasIcon';

import { displayTitleForPatrol, iconTypeForPatrol } from '../utils/patrols';
import { trimTrackDataToTimeRange } from '../utils/tracks';
import { updatePatrolTrackState } from '../ducks/patrols';
import { visibleTrackedPatrolData } from '../selectors/patrols';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import styles from '../TrackLegend/styles.module.scss';


const TitleElement = memo((props) => { // eslint-disable-line
  const { coverageLength, displayTitle, iconId, patrolData, patrolFilter, onRemovePatrolClick } = props;

  const convertPatrolTrackToDetailItem = useCallback(({ patrol, trackData, leader }) => {
    const title = displayTitleForPatrol(
      patrol,
      leader,
    );
    
    const iconId = iconTypeForPatrol(patrol);
    const { id } = patrol;

    const { filter: { date_range } } = patrolFilter;

    const trimmed = !!trackData && trimTrackDataToTimeRange(trackData, date_range.lower, date_range.upper);

    const trackLength = `${trimmed ? length(trimmed.track).toFixed(2): 0.00}km`;

    return <li key={id}>
      <DasIcon type='events' iconId={iconId} className={styles.svgIcon} title={`Icon for ${title}`} /> 
      <div className={styles.listItemDetails}>
        <span>{title}</span>
        <small>{trackLength} coverage today</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemovePatrolClick}>remove</Button>
    </li>;
  }, [onRemovePatrolClick, patrolFilter]);

  return <div className={styles.titleWrapper}>
    {iconId && <DasIcon type='events' iconId={iconId} className={styles.svgIcon} />}
    <div className={styles.innerTitleWrapper}>
      <h6>
        {displayTitle}
        {patrolData.length > 1 && <OverlayTrigger trigger="click" rootClose placement="right" overlay={
          <Popover className={styles.popover} id="track-details">
            <ul>
              {patrolData.map(convertPatrolTrackToDetailItem)}
            </ul>
          </Popover>
        }>
          <button type="button" className={styles.infoButton}>
            <InfoIcon className={styles.infoIcon} />
          </button>
        </OverlayTrigger>}
      </h6>
      <span>{coverageLength} coverage</span>
    </div>
  </div>;
});


const PatrolTrackLegend = (props) => {
  const { dispatch:_dispatch, patrolData, patrolFilter, updateTrackState, trackState, ...rest } = props;

  const hasData = !!patrolData.length;
  const isMulti = patrolData.length > 1;

  const displayTitle = useMemo(() => {
    if (!hasData) return null;
    if (!isMulti) return `Patrol: ${displayTitleForPatrol(
      patrolData[0].patrol,
      patrolData[0].leader,
    )}`;

    return `${patrolData.length} patrols`;
  }, [hasData, isMulti, patrolData]);

  const iconId = useMemo(() => {
    if (isMulti || !hasData) return null;

    return iconTypeForPatrol(patrolData[0].patrol);
  }, [hasData, isMulti, patrolData]);

  const coverageLength = useMemo(() => {
    if (!hasData) return '0km';
    
    const { filter: { date_range } } = patrolFilter;
    return `${patrolData
      .reduce((accumulator, { trackData }) => {
        const trimmed = !!trackData && trimTrackDataToTimeRange(trackData,  date_range.lower, date_range.upper);
        
        return accumulator + trimmed ? parseFloat(length(trimmed.track)): 0;
      }, 0).toFixed(2)}km`;
  }, [hasData, patrolData, patrolFilter]);

  const onRemovePatrolClick = useCallback(({ target: { value: id } }) => {
    updateTrackState({
      visible: trackState.visible.filter(val => val !== id),
      pinned: trackState.pinned.filter(val => val !== id),
    });
  }, [trackState.pinned, trackState.visible, updateTrackState]);

  return hasData ? <MapLegend
    {...rest}
    titleElement={
      <TitleElement displayTitle={displayTitle} iconId={iconId} patrolData={patrolData} patrolFilter={patrolFilter}
        onRemovePatrolClick={onRemovePatrolClick} coverageLength={coverageLength} />
    } /> : null;
};

const mapStateToProps = (state) => ({
  trackState: state.view.patrolTrackState,
  patrolData: visibleTrackedPatrolData(state),
  patrolFilter: state.data.patrolFilter,
});

const mapDispatchToProps = dispatch => ({
  updateTrackState: update => dispatch(updatePatrolTrackState(update)),
});

export default connect(mapStateToProps, mapDispatchToProps)(memo(PatrolTrackLegend));