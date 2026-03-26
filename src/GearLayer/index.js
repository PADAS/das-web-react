import React, { memo, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { MapContext } from '../App';
import { LAYER_IDS, SOURCE_IDS } from '../constants';
import { useMapEventBinding } from '../hooks';
import useMapLayers from '../hooks/useMapLayers';
import useMapSources from '../hooks/useMapSources';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';
import { buildGearMapFeatureCollection, GEAR_POINT_ROLE_TRAWL_END } from '../utils/gear';

const GearLayer = ({ onGearClick }) => {
  const map = useContext(MapContext);

  const allIds = useSelector((state) => state.data.gear.allIds);
  const byId = useSelector((state) => state.data.gear.byId);
  const hiddenGearIds = useSelector((state) => state.data.gear.hiddenGearIds);
  const tabEligible = useSelector((state) => state.data.gear.tabEligible);

  const geojson = useMemo(() => {
    const list = allIds.map((id) => byId[id]).filter(Boolean);
    return buildGearMapFeatureCollection(list, hiddenGearIds);
  }, [allIds, byId, hiddenGearIds]);

  const hasFeatures = tabEligible && geojson.features.length > 0;

  useMapSources([{ id: SOURCE_IDS.GEAR_FEATURES, data: geojson }]);

  useMapLayers([
    {
      id: LAYER_IDS.GEAR_LINE,
      type: 'line',
      sourceId: SOURCE_IDS.GEAR_FEATURES,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': '#0d6efd',
        'line-opacity': 0.9,
        'line-width': 3,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      options: {
        before: LAYER_IDS.SKY_LAYER,
      },
    },
    {
      id: LAYER_IDS.GEAR_POINT,
      type: 'circle',
      sourceId: SOURCE_IDS.GEAR_FEATURES,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': '#0d6efd',
        'circle-radius': [
          'match',
          ['get', 'gearPointRole'],
          GEAR_POINT_ROLE_TRAWL_END,
          6,
          8,
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
      options: {
        before: LAYER_IDS.SKY_LAYER,
      },
    },
  ]);

  const onLineClick = useMemo(() => withMultiLayerHandlerAwareness(map, (e) => {
    const hit = map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.GEAR_LINE] })[0];
    if (hit) onGearClick({ event: e, layer: hit });
  }), [map, onGearClick]);

  const onPointClick = useMemo(() => withMultiLayerHandlerAwareness(map, (e) => {
    const hit = map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.GEAR_POINT] })[0];
    if (hit) onGearClick({ event: e, layer: hit });
  }), [map, onGearClick]);

  useMapEventBinding('click', onLineClick, LAYER_IDS.GEAR_LINE, hasFeatures);
  useMapEventBinding('click', onPointClick, LAYER_IDS.GEAR_POINT, hasFeatures);

  return null;
};

export default memo(GearLayer);
