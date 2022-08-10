import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';
import { addMapImage } from '../utils/map';
import { visibleTrackDataWithPatrolAwareness } from '../selectors/patrols';
import Arrow from '../common/images/icons/track-arrow.svg';

import TrackLayer from './track';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

const ARROW_IMG_ID = 'track_arrow';

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const LayerComponent = ({ data, map, onPointClick, showTimepoints }) => {
  const linePaint = useMemo(() => ({
    'line-opacity': data.patrolTrackShown ? 0.4 : 1,
  }), [data.patrolTrackShown]);

  return <TrackLayer linePaint={linePaint} map={map} onPointClick={onPointClick} showTimepoints={showTimepoints} trackData={data} />;
};

const TracksLayer = (props) => {
  const { map, onPointClick, showTimepoints, trackData } = props;

  const onTimepointClick = useCallback((e) => {
    const layer = getPointLayer(e, map);
    mapLayerTracker.track('Clicked Track Timepoint');
    onPointClick(layer);
  }, [map, onPointClick]);

  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage({ src: Arrow, id: ARROW_IMG_ID });
    }
  }, []); // eslint-disable-line

  if (!trackData.length) return null;

  return trackData
    .map((data) =>
      <LayerComponent data={data} key={`track-layer-${data.track.features[0].properties.id}`} map={map} onPointClick={onTimepointClick} showTimepoints={showTimepoints} />
    );
};

const mapStateToProps = (state) => ({
  patrolTrackState: state.view.patrolTrackState,
  trackData: visibleTrackDataWithPatrolAwareness(state),
});


export default connect(mapStateToProps, null)(withMap(memo(TracksLayer),));

TracksLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

TracksLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
};
