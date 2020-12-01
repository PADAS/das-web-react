import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import length from '@turf/length';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import MapLegend from '../MapLegend';

import { displayTitleForPatrol } from '../utils/patrols';
import { updatePatrolTrackState } from '../ducks/patrols';
import { patrolTrackData } from '../selectors/patrols';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import styles from '../TrackLegend/styles.module.scss';


const TitleElement = memo((props) => { // eslint-disable-line
  const { coverageLength, displayTitle, iconSrc, patrolData, onRemovePatrolClick } = props;

  const convertPatrolTrackToDetailItem = useCallback(({ patrol, trackData }) => {
    const title = displayTitleForPatrol(patrol);
    
    const { properties: { image } } = trackData.track.features[0];
    const { id } = patrol;

    const trackLength = `${length(trackData.track).toFixed(2)}km`;

    return <li key={id}>
      <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
      <div>
        <span>{title}</span>
        <small>Coverage: {trackLength}</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemovePatrolClick}>remove</Button>
    </li>;
  }, [onRemovePatrolClick]);

  return <div className={styles.titleWrapper}>
    <div className={styles.innerTitleWrapper}>
      <h6>
        {displayTitle}
        {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
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
      <span>Coverage: {coverageLength}</span>
    </div>
  </div>;
});


const PatrolTrackLegend = (props) => {
  const { dispatch:_dispatch, onClose, patrolData, updateTrackState, trackState, ...rest } = props;

  const hasData = !!patrolData.length;
  const isMulti = patrolData.length > 1;

  const displayTitle = useMemo(() => {
    if (!hasData) return null;
    if (!isMulti) return `Patrol: ${displayTitleForPatrol(patrolData[0].patrol)}`;

    return `${patrolData.length} patrols`;
  }, [hasData, isMulti, patrolData]);

  const iconSrc = useMemo(() => {
    if (isMulti || !hasData) return null;

    return patrolData[0].trackData.track.features[0].properties.image;
  }, [hasData, isMulti, patrolData]);

  const coverageLength = useMemo(() =>
    `${patrolData
      .reduce((accumulator, { trackData }) => 
        accumulator + parseFloat(length(trackData.track)), 0
      ).toFixed(2)}km`, 
  [patrolData]);

  const onRemovePatrolClick = useCallback(({ target: { value: id } }) => {
    updateTrackState({
      visible: trackState.visible.filter(val => val !== id),
      pinned: trackState.pinned.filter(val => val !== id),
    });
  }, [trackState.pinned, trackState.visible]);

  return hasData ? <MapLegend
    {...rest}
    titleElement={
      <TitleElement displayTitle={displayTitle} iconSrc={iconSrc} patrolData={patrolData} onRemovePatrolClick={onRemovePatrolClick} onClose={onClose} coverageLength={coverageLength} />
    } /> : null;
};

const mapStateToProps = (state) => ({
  trackState: state.view.patrolTrackState,
  patrolData: patrolTrackData(state),
});

const mapDispatchToProps = dispatch => ({
  updateTrackState: update => dispatch(updatePatrolTrackState(update)),
});

export default connect(mapStateToProps, mapDispatchToProps)(memo(PatrolTrackLegend));