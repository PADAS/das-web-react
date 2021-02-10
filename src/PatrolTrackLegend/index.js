import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import length from '@turf/length';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import MapLegend from '../MapLegend';
import DasIcon from '../DasIcon';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';

import { displayTitleForPatrol, iconTypeForPatrol } from '../utils/patrols';
import { updatePatrolTrackState } from '../ducks/patrols';
import { visibleTrackedPatrolData } from '../selectors/patrols';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import styles from '../TrackLegend/styles.module.scss';


const TitleElement = memo((props) => { // eslint-disable-line
  const { coverageLength, displayTitle, iconId, patrolData, onRemovePatrolClick } = props;

  const convertPatrolTrackToDetailItem = useCallback(({ patrol, trackData, leader }) => {
    const title = displayTitleForPatrol(
      patrol,
      leader,
    );
    
    const iconId = iconTypeForPatrol(patrol);
    const { id } = patrol;

    const trackLength = `${trackData ? length(trackData.track).toFixed(2): 0.00}km`;

    return <li key={id}>
      <DasIcon type='events' iconId={iconId} className={styles.svgIcon} title={`Icon for ${title}`} /> 
      <div className={styles.listItemDetails}>
        <span>{title}</span>
        <small>{trackLength} covered</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemovePatrolClick}>remove</Button>
    </li>;
  }, [onRemovePatrolClick]);

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
      <span><PatrolDistanceCovered patrolsData={patrolData} /> covered</span>
    </div>
  </div>;
});


const PatrolTrackLegend = (props) => {
  const { dispatch:_dispatch, patrolData, updateTrackState, trackState, ...rest } = props;

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

  const onRemovePatrolClick = useCallback(({ target: { value: id } }) => {
    updateTrackState({
      visible: trackState.visible.filter(val => val !== id),
      pinned: trackState.pinned.filter(val => val !== id),
    });
  }, [trackState.pinned, trackState.visible, updateTrackState]);

  return hasData ? <MapLegend
    {...rest}
    titleElement={
      <TitleElement displayTitle={displayTitle} iconId={iconId} patrolData={patrolData}
        onRemovePatrolClick={onRemovePatrolClick} />
    } /> : null;
};

const mapStateToProps = (state) => ({
  trackState: state.view.patrolTrackState,
  patrolData: visibleTrackedPatrolData(state),
});

const mapDispatchToProps = dispatch => ({
  updateTrackState: update => dispatch(updatePatrolTrackState(update)),
});

export default connect(mapStateToProps, mapDispatchToProps)(memo(PatrolTrackLegend));