import React, { memo, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectPatrolData } from '../selectors/patrols';
import { MapContext } from '../App';
import { trimTrackDataToTimeRange } from '../utils/tracks';

import TrackLayer from '../TracksLayer/track';

const LINE_PAINT = {
  'line-width': ['step', ['zoom'], 2, 8, ['+', ['get', 'stroke-width'], 1.5]],
  'line-offset': -0.75,
  'line-opacity': 1,
};

const getPointLayer = (event, map) => map.queryRenderedFeatures(event.point)
  .filter((item) => item.layer.id.includes('track-layer-points-'))[0];

const PatrolTrackLayer = ({ onPointClick, patrol: patrolFromProps, trackTimeEnvelope, ...restProps }) => {
  const map = useContext(MapContext);

  const { patrol, trackData } = useSelector((state) => {
    return selectPatrolData(state, patrolFromProps);
  });
  const showTrackTimepoints = useSelector((state) => state.view.showTrackTimepoints);

  const trimmedTrackData = useMemo(
    () => !!trackData && trimTrackDataToTimeRange(trackData, trackTimeEnvelope.from, trackTimeEnvelope.until),
    [trackData, trackTimeEnvelope.from, trackTimeEnvelope.until]
  );

  return trackData && trackData.track ? <TrackLayer
    id={patrol.id}
    linePaint={LINE_PAINT}
    onPointClick={(event) => onPointClick(getPointLayer(event, map))}
    showTimepoints={showTrackTimepoints}
    trackData={trimmedTrackData}
    {...restProps}
  /> : null;
};

export default memo(PatrolTrackLayer);
