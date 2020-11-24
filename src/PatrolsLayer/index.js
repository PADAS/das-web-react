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

      const patrolPoints = extractPatrolPointsFromTrackData(data, patrols)

      const patrolPointsSourceData = {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            patrolPoints.start_location,
            patrolPoints.end_location
          ]
        }
      };

      const labelLayout = {
        'text-offset': [0, 3.5]
      };

      return <Fragment key={index}>
        <Source id='patrol-symbol-source' geoJsonSource={patrolPointsSourceData} />
        <LabeledPatrolSymbolLayer labelLayout={labelLayout} layout={layout} textPaint={symbolPaint} sourceId='patrol-symbol-source' type='symbol'
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
