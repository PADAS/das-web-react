import React, { memo, useCallback, useEffect, Fragment, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Source } from 'react-mapbox-gl';

import { withMap } from '../EarthRangerMap';
import { addMapImage } from '../utils/map';
import { trimmedVisibleTrackData } from '../selectors/tracks';
import Arrow from '../common/images/icons/track-arrow.svg';

import TrackLayer from './track';
import { trackEvent } from '../utils/analytics';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT, LAYER_IDS } from '../constants';
import withMapViewConfig from '../WithMapViewConfig';

const { PATROL_SYMBOLS } = LAYER_IDS;

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};
const ARROW_IMG_ID = 'track_arrow';

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];

const TracksLayer = (props) => {
  const { allowOverlap, map, mapUserLayoutConfig, onPointClick, showTimepoints, trackData } = props;
  const [layerIds, setLayerIds] = useState([]);

  const onTimepointClick = useCallback((e) => {
    const layer = getPointLayer(e, map);
    trackEvent('Map Layers', 'Clicked Track Timepoint');
    onPointClick(layer);
  }, [map, onPointClick]);

  const layout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layoutConfig,
  };

  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage({ src: Arrow, id: ARROW_IMG_ID });
    }
  }, []); // eslint-disable-line

  const onSymbolClick = () => {};

  const layoutConfig = allowOverlap ? {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    ...mapUserLayoutConfig,
  } : { ...mapUserLayoutConfig };

  const patrolPointsSourceData = {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        trackData[0].patrol_points.start_location,
        trackData[0].patrol_points.end_location
      ]
    }
  };

  if (!trackData.length) return null;

  return <Fragment>
    {trackData.map(data => <Fragment>
      <TrackLayer key={`track-layer-${data.track.features[0].properties.id}`} map={map} onPointClick={onTimepointClick} showTimepoints={showTimepoints} trackData={data} />
      <Source id='patrol-symbol-source' geoJsonSource={patrolPointsSourceData} />
      <LabeledPatrolSymbolLayer layout={layout} textPaint={symbolPaint} sourceId='patrol-symbol-source' type='symbol'
        id={PATROL_SYMBOLS} onClick={onSymbolClick}
        onInit={setLayerIds}
      />
    </Fragment>)}
  </Fragment>;
};

const mapStateToProps = (state) => ({
  trackData: trimmedVisibleTrackData(state),
});


export default connect(mapStateToProps, null)(withMap(
  memo(withMapViewConfig(TracksLayer)),
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
