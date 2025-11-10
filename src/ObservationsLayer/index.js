import React, { memo, useContext, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../App';
import { API_URL } from '../constants';

const OBSERVATIONS_SOURCE = 'observations-source';

const VECTOR_TILE_URL = `${API_URL}observations/tiles/{z}/{x}/{y}.pbf`;

export const OBSERVATIONS_LINES_LAYER_ID = 'observations-lines';

const DEFAULT_OBSERVATION_LINE_PAINT_COLOR = [
  'case',
  ['has', 'stroke'], ['get', 'stroke'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'line_color'], ['get', 'line_color'],
  ['has', 'stroke_color'], ['get', 'stroke_color'],
  '#0066cc' // Default blue color for observations
];

const ObservationsLayer = ({ onFeatureClick }) => {
  const map = useContext(MapContext);
  const token = useSelector(state => state.data.token);
  const mapFeatureHighlightIDs = useSelector(state => state.view.mapFeatureHighlightIDs || []);
  const hiddenFeatureIDs = useSelector(state => state.data.mapLayerFilter?.hiddenFeatureIDs ?? []);

  // Filter for multipoint collections converted to line strings
  const lineLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'LineString'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);

  const handleFeatureClick = useCallback((event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [OBSERVATIONS_LINES_LAYER_ID]
    });

    if (features.length > 0 && onFeatureClick) {
      features.forEach((feature) => {
        onFeatureClick(feature, event);
      });
    }
  }, [map, onFeatureClick]);

  const onMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, [map]);

  /* add the vector source + append bearer token to request headers */
  /* add the vector layer and bind the event handlers */
  useEffect(() => {
    if (!map) return;

    if (!map.getSource(OBSERVATIONS_SOURCE)) {
      map.addSource(OBSERVATIONS_SOURCE, {
        type: 'vector',
        tiles: [VECTOR_TILE_URL],
        minzoom: 0,
        maxzoom: 22,
        transformRequest: (url, resourceType) => {
          if (resourceType === 'Tile' && token?.access_token) {
            return {
              url,
              headers: {
                'Authorization': `Bearer ${token.access_token}`
              }
            };
          }
          return { url };
        }
      });
    }

    /* add the observations lines layer */
    if (!map.getLayer(OBSERVATIONS_LINES_LAYER_ID)) {
      map.addLayer({
        id: OBSERVATIONS_LINES_LAYER_ID,
        type: 'line',
        source: OBSERVATIONS_SOURCE,
        'source-layer': 'observations',
        paint: {
          'line-color': DEFAULT_OBSERVATION_LINE_PAINT_COLOR,
          'line-width': [
            'case',
            ['has', 'stroke-width'], ['get', 'stroke-width'],
            ['has', 'width'], ['get', 'width'],
            ['has', 'line_width'], ['get', 'line_width'],
            ['has', 'stroke_width'], ['get', 'stroke_width'],
            2
          ],
          'line-opacity': [
            'case',
            ['has', 'stroke-opacity'], ['get', 'stroke-opacity'],
            ['has', 'opacity'], ['get', 'opacity'],
            ['has', 'line_opacity'], ['get', 'line_opacity'],
            ['has', 'stroke_opacity'], ['get', 'stroke_opacity'],
            0.8
          ]
        },
        filter: lineLayerFilter
      });
    }

    const layerIds = [OBSERVATIONS_LINES_LAYER_ID];

    layerIds.forEach(layerId => {
      map.on('click', layerId, handleFeatureClick);
    });

    map.on('mouseenter', OBSERVATIONS_LINES_LAYER_ID, onMouseEnter);
    map.on('mouseleave', OBSERVATIONS_LINES_LAYER_ID, onMouseLeave);

    return () => {
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.off('click', layerId, handleFeatureClick);
          map.removeLayer(layerId);
        }
      });

      map.off('mouseenter', OBSERVATIONS_LINES_LAYER_ID, onMouseEnter);
      map.off('mouseleave', OBSERVATIONS_LINES_LAYER_ID, onMouseLeave);

      if (map.getSource(OBSERVATIONS_SOURCE)) {
        map.removeSource(OBSERVATIONS_SOURCE);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, handleFeatureClick, onMouseEnter, onMouseLeave, token?.access_token]);

  /* highlight observations based on the values in mapFeatureHighlightIDs */
  useEffect(() => {
    const lineLayer = map?.getLayer?.(OBSERVATIONS_LINES_LAYER_ID);

    if (lineLayer) {
      const highlightLinePaintColor = [
        ...DEFAULT_OBSERVATION_LINE_PAINT_COLOR.slice(0, 1),
        ['in', ['get', 'id'], ['literal', mapFeatureHighlightIDs]], 'red',
        ...DEFAULT_OBSERVATION_LINE_PAINT_COLOR.slice(1),
      ];

      map.setPaintProperty(lineLayer.id, 'line-color', highlightLinePaintColor);
    }
  }, [map, mapFeatureHighlightIDs]);

  /* filter out line features which are hidden by ID */
  useEffect(() => {
    const lineLayer = map?.getLayer?.(OBSERVATIONS_LINES_LAYER_ID);

    if (lineLayer) {
      map.setFilter(lineLayer.id, lineLayerFilter);
    }
  }, [map, lineLayerFilter]);

  return null;
};

export default memo(ObservationsLayer);