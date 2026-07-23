import React, { memo, useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { addMapImage } from '../utils/map';
import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { selectPatrolData } from '../selectors/patrols';
import { DEFAULT_SYMBOL_PAINT, LAYER_IDS, MAP_ICON_SIZE, MAP_ICON_SCALE } from '../constants';
import { uuid } from '../utils/string';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import { MapContext } from '../MapContext';
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

// The patrol name renders on the icon layer (to the right of the pin) as black
// text with a white halo/border and no background chip, matching the design.
const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-color': '#000000',
  'text-halo-blur': 0.5,
  'text-halo-color': '#ffffff',
  'text-halo-width': 2,
};

// The chip label layer is suppressed (blank text + hidden chip); the name is
// drawn on the icon layer instead so it can sit to the right of the pin.
const textLayout = {
  'text-field': '',
};

const labelTextPaint = {
  'icon-opacity': 0,
};

// Mirror the shared (non-generic) icon-size zoom curve, but scale its output so
// the pin renders 32px tall at full zoom while still shrinking when zoomed out,
// matching the other map icons. A zoom-based interpolate must be the top-level
// expression, so we bake the scale into the output stops rather than wrapping
// the shared expression.
const PIN_ICON_HEIGHT = 32;
const PIN_SIZE_SCALE = PIN_ICON_HEIGHT / MAP_ICON_SIZE;
const PIN_ICON_SIZE = [
  'interpolate', ['exponential', 0.5], ['zoom'],
  0, (0.2 / MAP_ICON_SCALE) * PIN_SIZE_SCALE,
  14, (1 / MAP_ICON_SCALE) * PIN_SIZE_SCALE,
];

// Pin tip sits on the patrol location; the patrol name sits to the right of the
// pin, vertically centered on the pin head.
const iconLayout = {
  'icon-anchor': 'bottom',
  'icon-size': PIN_ICON_SIZE,
  'text-field': '{title}',
  'text-anchor': 'left',
  'text-justify': 'left',
  'text-offset': [1.1, -1.2],
};

const symbolFilter = ['==', ['geometry-type'], 'Point'];


const StartStopLayer = ({ patrolData, ...rest }) => {
  const map = useContext(MapContext);

  const [instanceId] = useState(uuid());
  const layerId = `${PATROL_SYMBOLS}-${instanceId}`;

  const points = patrolData?.startStopGeometries?.points;
  const lines = patrolData?.startStopGeometries?.lines;

  useEffect(() => {
    const pointFeatures = patrolData?.startStopGeometries?.points;

    if (pointFeatures) {
      Object.values(pointFeatures)
        .filter(Boolean)
        .forEach(({ properties: { image } = {} }) => {
          if (image && !map.hasImage(calcImgIdFromUrlForMapImages(image))) {
            addMapImage({ src: image });
          }
        });
    }
  }, [map, patrolData]);

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

  const layerSymbolPaint = useMemo(() => ({ ...symbolPaint }), []);
  const layerLinePaint = useMemo(() => ({ ...linePaint, 'line-color': ['get', 'stroke'] }), []);

  useMapSources([{ id: sourceId, data: patrolPointsSourceData }]);
  useMapLayers([{
    id: `${layerId}-lines`,
    type: 'line',
    sourceId,
    paint: layerLinePaint,
    layout: lineLayout
  }]);

  // The symbol layer is added by a memoized child whose add-layer effect runs
  // before this component's source-creation effect. When the patrol data is
  // already loaded at mount, the source doesn't exist yet on that first pass and
  // the memoized child never re-renders to retry. Wait for the source to exist
  // (signalled by a sourcedata event) before mounting the child so its layer
  // reliably attaches.
  const [isSourceReady, setIsSourceReady] = useState(false);
  useEffect(() => {
    if (!map) return undefined;

    const handleSourceData = () => {
      if (map.getSource(sourceId)) {
        setIsSourceReady(true);
        map.off('sourcedata', handleSourceData);
      }
    };
    map.on('sourcedata', handleSourceData);

    return () => map.off('sourcedata', handleSourceData);
  }, [map, sourceId]);

  if (!points && !lines) return null;

  return isSourceReady ? <LabeledPatrolSymbolLayer paint={layerSymbolPaint} sourceId={sourceId} type='symbol'
      id={layerId} filter={symbolFilter} layout={iconLayout} textLayout={textLayout}
      textPaint={labelTextPaint} {...rest}
    /> : null;
};

const makeMapStateToProps = () => {
  const mapStateToProps = (state, props) => {
    return {
      patrolData: selectPatrolData(state, props.patrol),
    };
  };
  return mapStateToProps;
};


export default connect(makeMapStateToProps, null)(memo(withMapViewConfig(StartStopLayer)));
