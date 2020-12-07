import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { uuid } from '../utils/string';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { visibleTrackDataWithPatrolAwareness } from '../selectors/patrols';

import { withMap } from '../EarthRangerMap';
import TrackLayer from '../TracksLayer/track';

const linePaint = {
  'line-width': ['step', ['zoom'], 2, 8, ['+',['get', 'stroke-width'], 1.5]],
  'line-offset': -0.75,
  'line-opacity': 1,
};

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];

const PatrolTrackLayer = (props) => {
  const { map, trackData, showTrackTimepoints, trackLength, tracks, dispatch:_dispatch, onPointClick, ...rest } = props;

  const uniqueId = useMemo(() => uuid(), []);
  const id = useMemo(() => `patrol-track-${uniqueId}-${trackData.track.features[0].properties.id}`, [trackData.track.features, uniqueId]);

  const onTimepointClick = useCallback((e) => {
    const layer = getPointLayer(e, map);
    onPointClick(layer);
  }, [map, onPointClick]);

  if (!trackData || !trackData.track) return null;

  return <TrackLayer key={id} id={id} linePaint={linePaint} map={map} showTimepoints={showTrackTimepoints} onPointClick={onTimepointClick} trackData={trackData} {...rest} />;
};

const mapStateToProps = (state) => {
  const { view: { showTrackTimepoints, trackLength } } = state;
  return {
    tracks: visibleTrackDataWithPatrolAwareness(state),
    trackLength: trackLength,
    showTrackTimepoints: showTrackTimepoints,
  };
};

export default connect(mapStateToProps, null)(
  withMap(
    memo(PatrolTrackLayer)
  )
);

PatrolTrackLayer.propTypes = {
  patrol: PropTypes.object,
};