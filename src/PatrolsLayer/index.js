import React, { Fragment, memo, useState } from 'react';
import PropTypes from 'prop-types';

import { Source } from 'react-mapbox-gl';
import { connect } from 'react-redux';

import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT, LAYER_IDS } from '../constants';
import { withMap } from '../EarthRangerMap';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import { getPatrols } from '../selectors/tracks';
import { trimmedVisibleTrackData } from '../selectors/tracks';
import withMapViewConfig from '../WithMapViewConfig';
import { extractPatrolPointsFromTrackData } from '../utils/patrols';


const { PATROL_SYMBOLS } = LAYER_IDS;

const PatrolLayer = ({ allowOverlap, map, mapUserLayoutConfig, onPointClick, patrols, showTimepoints, trackData, ...props}) => {

  const [ layerIds, setLayerIds ] = useState(null);

  if (!trackData.length) return null;

  const symbolPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'text-color': '#ffffff',
    'text-halo-blur': 0.5,
    'text-halo-color': 'rgba(0,0,0,0.7)',
    'text-halo-width': 0.5,
  };

  const labelPaint = {
    'icon-opacity': 1,
    'text-color': '#ffffff',
    'text-halo-color': 'rgba(0,0,0,0.7)',
  };

  const layoutConfig = allowOverlap ? {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    ...mapUserLayoutConfig,
  } : { ...mapUserLayoutConfig };

  const layout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layoutConfig,
  };

  const onSymbolClick = () => {};

  return <Fragment>
    {trackData.map((data, index) => {

      const patrolPoints = extractPatrolPointsFromTrackData(data, patrols);

      if (!patrolPoints) return <Fragment />

      const patrolPointFeatures = patrolPoints.are_start_and_end_locations_the_same ? [
        {
          ...patrolPoints.start_location,
          properties: {
            ...patrolPoints.start_location.properties,
            title: `${patrolPoints.start_location.properties.title} & ${patrolPoints.end_location.properties.title}`
          }
        },
      ] : [
        patrolPoints.start_location,
        patrolPoints.end_location,
      ];

      const patrolPointsSourceData = {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: patrolPointFeatures.filter(value => Boolean(value))
        }
      };

      symbolPaint['text-color'] = patrolPoints.start_location.properties.stroke;
      labelPaint['icon-color'] = patrolPoints.start_location.properties.stroke;

      return <Fragment key={index}>
        <Source id='patrol-symbol-source' geoJsonSource={patrolPointsSourceData} />
        <LabeledPatrolSymbolLayer labelPaint={labelPaint} layout={layout} symbolPaint={symbolPaint} sourceId='patrol-symbol-source' type='symbol'
          id={PATROL_SYMBOLS} onClick={onSymbolClick}
          onInit={setLayerIds}
        />
      </Fragment>
    })}
  </Fragment>;

}

const mapStateToProps = (state) => ({
  patrols: getPatrols(state),
  trackData: trimmedVisibleTrackData(state),
});


export default connect(mapStateToProps, null)(withMap(
  memo(withMapViewConfig(PatrolLayer)),
));

PatrolLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

PatrolLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
};
