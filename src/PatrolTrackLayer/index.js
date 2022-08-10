import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { createPatrolDataSelector } from '../selectors/patrols';
import { trimTrackDataToTimeRange } from '../utils/tracks';

import { withMap } from '../EarthRangerMap';
import TrackLayer from '../TracksLayer/track';


const linePaint = {
  'line-width': ['step', ['zoom'], 2, 8, ['+', ['get', 'stroke-width'], 1.5]],
  'line-offset': -0.75,
  'line-opacity': 1,
};

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];

const PatrolTrackLayer = (props) => {
  // eslint-disable-next-line no-unused-vars
  const { map, patrolData: { trackData, patrol }, showTrackTimepoints, trackTimeEnvelope, tracks, dispatch: _dispatch, onPointClick, ...rest } = props;

  const trimmedTrackData = useMemo(() =>
    !!trackData
    && trimTrackDataToTimeRange(trackData, trackTimeEnvelope.from, trackTimeEnvelope.until),
  [trackData, trackTimeEnvelope.from, trackTimeEnvelope.until]);

  const onTimepointClick = useCallback((e) => {
    const layer = getPointLayer(e, map);
    onPointClick(layer);
  }, [map, onPointClick]);

  if (!trackData || !trackData.track) return null;

  return <TrackLayer id={patrol.id} linePaint={linePaint} map={map} showTimepoints={showTrackTimepoints} onPointClick={onTimepointClick} trackData={trimmedTrackData} {...rest} />;
};

const makeMapStateToProps = () => {
  const getDataForPatrolFromProps = createPatrolDataSelector();

  const mapStateToProps = (state, props) => {
    const { view: { showTrackTimepoints } } = state;
    return {
      patrolData: getDataForPatrolFromProps(state, props),
      showTrackTimepoints,
    };
  };
  return mapStateToProps;
};

export default connect(makeMapStateToProps, null)(
  withMap(
    memo(PatrolTrackLayer)
  )
);

PatrolTrackLayer.propTypes = {
  patrol: PropTypes.object,
};