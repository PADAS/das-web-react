import React, { memo, Component, Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';
import isEqual from 'lodash/isEqual';
import { featureCollection } from '@turf/helpers';

import { svgSrcToPngImg } from '../utils/img';
import { getTrackPointsFromTrackFeatureArray } from '../selectors';
import { getSubjectIDFromFirstFeatureInCollection, convertArrayOfTracksIntoFeatureCollection } from '../utils/tracks';
import Arrow from '../common/images/icons/track-arrow.svg';

const ARROW_IMG_ID = 'track_arrow';
const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-timepoint'))[0];


const TracksLayer = memo(function TracksLayer(props) {
  const { map, onPointClick, trackCollection, ...rest } = props;
  const tracksAsPoints = getTrackPointsFromTrackFeatureArray(trackCollection);
  const tracksAsFeatureCollection = convertArrayOfTracksIntoFeatureCollection(trackCollection);

  useEffect(() => {
    async function addImage() {
      if (!map.hasImage(ARROW_IMG_ID)) {
        const arrow = await svgSrcToPngImg(Arrow);
        map.addImage(ARROW_IMG_ID, arrow);
      }
    }
    addImage();
  });

  return (
    <Fragment>
      <GeoJSONLayer key={`track-layer`} before="subject_symbols-symbol" id={`track-layer`} data={tracksAsFeatureCollection} {...rest}
        linePaint={{
          'line-color': [
            'case',
            ['has', 'stroke'], ['get', 'stroke'],
            'orange',
          ],
          // 'line-color': ['get', 'stroke'] || 'orange',
          'line-width': ["step", ["zoom"], 0, 8, ['get', 'stroke-width']],
        }}
        lineLayout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
      {/* {tracksAsPoints.map((feature) => { */}
      {/* const id = getSubjectIDFromFirstFeatureInCollection(feature); */}
      <GeoJSONLayer before="subject_symbols-symbol" id={`track-layer-timepoints`} data={tracksAsPoints} {...rest}
        symbolOnMouseEnter={() => map.getCanvas().style.cursor = 'pointer'}
        symbolOnClick={e => onPointClick(getPointLayer(e, map))}
        symbolOnMouseLeave={() => map.getCanvas().style.cursor = ''}
        symbolLayout={{
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
          'icon-size': ['step', ['zoom'], 0, 14, .3, 16, .5],
          'icon-rotate': ['get', 'bearing'],
          'icon-image': 'track_arrow',
          'icon-pitch-alignment': 'map',
          'icon-rotation-alignment': 'map',
        }}
      />
      // })
      }
    </Fragment>
  );
}, (prev, current) => isEqual(prev.trackCollection, current.trackCollection));

export default TracksLayer;

TracksLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
};

TracksLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  trackCollection: PropTypes.array.isRequired,
}