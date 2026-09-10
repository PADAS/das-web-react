import React, { memo, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { selectPatrolTrackData } from '../selectors/patrols';
import { DEFAULT_SYMBOL_PAINT, LAYER_IDS, MAP_ICON_SIZE, MAP_ICON_SCALE } from '../constants';
import { uuid } from '../utils/string';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import withMapViewConfig from '../WithMapViewConfig';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

const { PATROL_SYMBOLS } = LAYER_IDS;

const linePaint = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-dasharray': [1, 2],
  'line-width': ['step', ['zoom'], 2, 8, 2.5],
  'line-offset': -0.75,
  'line-opacity': 0.8,
};

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

// Scale the shared icon-size zoom curve so the pin renders 32px tall at full
// zoom. A zoom interpolate must stay top-level, so the scale is baked into the
// output stops rather than wrapping the shared expression.
const PIN_ICON_SIZE = [
  'interpolate', ['exponential', 0.5], ['zoom'],
  0, (0.2 / MAP_ICON_SCALE) * (32 / MAP_ICON_SIZE),
  14, (1 / MAP_ICON_SCALE) * (32 / MAP_ICON_SIZE),
];

const iconLayout = {
  'icon-anchor': 'bottom',
  'icon-size': PIN_ICON_SIZE,
};

// Name sits to the right of the pin (kept on the label layer so the Map Markers
// visibility toggle still applies).
const textLayout = {
  'text-field': '{title}',
  'text-anchor': 'left',
  'text-justify': 'left',
  'text-offset': [1.1, -1.2],
};

// Black name text with a white halo and no background chip.
const labelTextPaint = {
  'icon-opacity': 0,
  'text-color': '#000000',
  'text-halo-color': '#ffffff',
  'text-halo-width': 2,
};

const symbolFilter = ['==', ['geometry-type'], 'Point'];


const StartStopLayer = ({ patrolTrackData, ...rest }) => {
  const [instanceId] = useState(uuid());
  const layerId = `${PATROL_SYMBOLS}-${instanceId}`;

  const points = patrolTrackData?.startStopGeometries?.points;
  const lines = patrolTrackData?.startStopGeometries?.lines;

  const sourceId = `patrol-symbol-source-${instanceId}`;

  const patrolPointFeatures = useMemo(() => {
    return [
      ...Object.values(points || {}),
      lines,
    ].filter(val => !!val);
  }, [lines, points]);

  const patrolPointsSourceData = useMemo(() => ({
    type: 'FeatureCollection',
    features: patrolPointFeatures,
  }), [patrolPointFeatures]);

  const layerLinePaint = useMemo(() => ({ ...linePaint, 'line-color': ['get', 'stroke'] }), []);

  useMapSources([{ id: sourceId, data: patrolPointsSourceData }]);
  useMapLayers([{
    id: `${layerId}-lines`,
    type: 'line',
    sourceId,
    paint: layerLinePaint,
    layout: lineLayout
  }]);

  if (!points && !lines) return null;

  return <LabeledPatrolSymbolLayer paint={DEFAULT_SYMBOL_PAINT} sourceId={sourceId} type='symbol'
      id={layerId} filter={symbolFilter} layout={iconLayout} textLayout={textLayout}
      textPaint={labelTextPaint} {...rest}
    />;
};

const makeMapStateToProps = () => {
  const mapStateToProps = (state, props) => {
    return {
      patrolTrackData: selectPatrolTrackData(state, props.patrol),
    };
  };
  return mapStateToProps;
};


export default connect(makeMapStateToProps, null)(memo(withMapViewConfig(StartStopLayer)));
