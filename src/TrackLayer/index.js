import React, { memo, Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

import { withMap } from '../EarthRangerMap';
import { GENERATED_LAYER_IDS, LAYER_IDS } from '../constants';
import { imgElFromSrc } from '../utils/img';
import { convertArrayOfTracksIntoFeatureCollection, convertArrayOfTracksToPointFeatureCollection } from '../utils/tracks';
import Arrow from '../common/images/icons/track-arrow.svg';

const ARROW_IMG_ID = 'track_arrow';
const { TRACKS_LINES, TRACK_TIMEPOINTS_SYMBOLS } = LAYER_IDS;
const { SUBJECT_SYMBOLS } = GENERATED_LAYER_IDS;

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-timepoint'))[0];

const trackLayerLinePaint = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-width': ['step', ['zoom'], 1, 8, ['get', 'stroke-width']],
};

const trackLayerLineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const timepointLayerLayout = {
  'icon-allow-overlap': true,
  'icon-anchor': 'bottom',
  'icon-size': [
    'interpolate', ['linear'], ['zoom'],
    0, 0,
    10, 0,
    18, 0.75,
  ],
  'icon-rotate': ['get', 'bearing'],
  'icon-image': 'track_arrow',
  'icon-pitch-alignment': 'map',
  'icon-rotation-alignment': 'map',
};



const TracksLayer = memo(function TracksLayer(props) {
  const { map, onPointClick, trackCollection, showTimepoints, ...rest } = props;
  const tracksAsPoints = convertArrayOfTracksToPointFeatureCollection(trackCollection);
  const tracksAsFeatureCollection = convertArrayOfTracksIntoFeatureCollection(trackCollection);
  const onSymbolClick = e => onPointClick(getPointLayer(e, map));
  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';


  useEffect(() => {
    async function addImage() {
      if (!map.hasImage(ARROW_IMG_ID)) {
        const arrow = await imgElFromSrc(Arrow);
        map.addImage(ARROW_IMG_ID, arrow);
      }
    }
    addImage();
  }, []);

  return (
    <Fragment>
      <GeoJSONLayer key={'track-layer'} before={SUBJECT_SYMBOLS} id={TRACKS_LINES} data={tracksAsFeatureCollection} {...rest}
        linePaint={trackLayerLinePaint}
        lineLayout={trackLayerLineLayout}
      />
      {showTimepoints && <GeoJSONLayer before={SUBJECT_SYMBOLS} id={TRACK_TIMEPOINTS_SYMBOLS} data={tracksAsPoints} {...rest}
        symbolOnMouseEnter={onSymbolMouseEnter}
        symbolOnClick={onSymbolClick}
        symbolOnMouseLeave={onSymbolMouseLeave}
        symbolLayout={timepointLayerLayout}
      />}
    </Fragment>
  );
}, (prev, current) => isEqual(prev.trackCollection, current.trackCollection) && isEqual(prev.showTimepoints && current.showTimepoints));

export default withMap(TracksLayer);

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
  trackCollection: PropTypes.array.isRequired,
};