import React, { memo, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { MapContext } from '../App';
import { LAYER_IDS, SOURCE_IDS } from '../constants';
import { safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';
import { buildGearMapFeatureCollection, GEAR_POINT_ROLE_TRAWL_END } from '../utils/gear';

const GearLayer = ({ onGearClick }) => {
  const map = useContext(MapContext);

  const allIds = useSelector((state) => state.data.gear.allIds);
  const byId = useSelector((state) => state.data.gear.byId);
  const hiddenGearIds = useSelector((state) => state.data.gear.hiddenGearIds);
  const hasGear = useSelector((state) => state.data.gear.hasGear);

  const geojson = useMemo(() => {
    const list = allIds.map((id) => byId[id]).filter(Boolean);
    return buildGearMapFeatureCollection(list, hiddenGearIds);
  }, [allIds, byId, hiddenGearIds]);

  const shouldRender = hasGear && geojson.features.length > 0;

  useEffect(() => {
    if (!map) return undefined;

    const sourceId = SOURCE_IDS.GEAR_FEATURES;
    const lineLayerId = LAYER_IDS.GEAR_LINE;
    const pointLayerId = LAYER_IDS.GEAR_POINT;
    const beforeId = LAYER_IDS.SKY_LAYER;

    const tearDown = () => {
      if (map.getLayer(pointLayerId)) safeRemoveMapLayer(map, pointLayerId);
      if (map.getLayer(lineLayerId)) safeRemoveMapLayer(map, lineLayerId);
      if (map.getSource(sourceId)) safeRemoveMapSource(map, sourceId);
    };

    if (!shouldRender) {
      tearDown();
      return undefined;
    }

    if (!map.getSource(sourceId)) {
      // Initial data; subsequent updates use setData in the effect below.
      map.addSource(sourceId, { type: 'geojson', data: geojson });
    }

    if (!map.getLayer(lineLayerId)) {
      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
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
      }, beforeId);
    }

    if (!map.getLayer(pointLayerId)) {
      map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-color': '#0d6efd',
          'circle-radius': [
            'step',
            ['zoom'],
            [
              'match',
              ['get', 'gearPointRole'],
              GEAR_POINT_ROLE_TRAWL_END,
              4,
              5,
            ],
            13,
            [
              'match',
              ['get', 'gearPointRole'],
              GEAR_POINT_ROLE_TRAWL_END,
              6,
              8,
            ],
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['step', ['zoom'], 1.5, 13, 2],
        },
      }, beforeId);
    }

    return tearDown;
  }, [map, shouldRender]); // geojson updates applied in the following effect via setData

  useEffect(() => {
    if (!map || !shouldRender) return;
    const source = map.getSource(SOURCE_IDS.GEAR_FEATURES);
    if (source?.setData) {
      source.setData(geojson);
    }
  }, [map, shouldRender, geojson]);

  useEffect(() => {
    if (!map || !shouldRender || !onGearClick) return undefined;

    const lineLayerId = LAYER_IDS.GEAR_LINE;
    const pointLayerId = LAYER_IDS.GEAR_POINT;

    const handleLineClick = withMultiLayerHandlerAwareness(map, (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: [lineLayerId] })[0];
      if (hit) onGearClick({ event: e, layer: hit });
    });

    const handlePointClick = withMultiLayerHandlerAwareness(map, (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: [pointLayerId] })[0];
      if (hit) onGearClick({ event: e, layer: hit });
    });

    map.on('click', lineLayerId, handleLineClick);
    map.on('click', pointLayerId, handlePointClick);

    return () => {
      map.off('click', lineLayerId, handleLineClick);
      map.off('click', pointLayerId, handlePointClick);
    };
  }, [map, shouldRender, onGearClick]);

  return null;
};

export default memo(GearLayer);
