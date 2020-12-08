import React, { memo, useCallback, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';

import { withMap } from '../EarthRangerMap';
import { addMapImage } from '../utils/map';
import { visibleTrackDataWithPatrolAwareness } from '../selectors/patrols';
import Arrow from '../common/images/icons/track-arrow.svg';

import TrackLayer from './track';
import { trackEvent } from '../utils/analytics';
import withMapViewConfig from '../WithMapViewConfig';

const ARROW_IMG_ID = 'track_arrow';

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];

const TracksLayer = (props) => {
  const { map, onPointClick, patrolTrackState, showTimepoints, trackData } = props;

  const onTimepointClick = useCallback((e) => {
    const layer = getPointLayer(e, map);
    trackEvent('Map Layers', 'Clicked Track Timepoint');
    onPointClick(layer);
  }, [map, onPointClick]);

  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage({ src: Arrow, id: ARROW_IMG_ID });
    }
  }, []); // eslint-disable-line

  const patrolTrackIds = uniq([...patrolTrackState.visible, ...patrolTrackState.pinned]);

  if (!trackData.length) return null;

  return <Fragment>{trackData.map(data => {
    const linePaint = data.patrolTrackShown ? { 'line-opacity': 0.4 } : {};

    return <TrackLayer key={`track-layer-${data.track.features[0].properties.id}`} linePaint={linePaint} map={map} onPointClick={onTimepointClick} showTimepoints={showTimepoints} trackData={data} />;
  })}</Fragment>;
};

const mapStateToProps = (state) => ({
  patrolTrackState: state.view.patrolTrackState,
  trackData: visibleTrackDataWithPatrolAwareness(state),
});


export default connect(mapStateToProps, null)(withMap(
  memo(TracksLayer),
));

// export default withMap(memo(withMapViewConfig(SubjectsLayer)));

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
