import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { selectShouldSubjectsBeClustered } from '../selectors/clusters';
import { DEFAULT_SYMBOL_LAYOUT, LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { MapContext } from '../MapContext';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';
import useMapSources from '../hooks/useMapSources';

import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import withMapViewConfig from '../WithMapViewConfig';

const { SUBJECT_SYMBOLS, SKY_LAYER } = LAYER_IDS;
const { CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const CLUTERED_FILTER = [
  'all',
  ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
  ['!=', 'is_static', true],
  ['!has', 'point_count']
];
const UNCLUSTERED_FILTER = [
  'all',
  ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
  ['!=', 'is_static', true]
];

const UNCLUSTERED_LAYER_ID = `${SUBJECT_SYMBOLS}-unclustered`;
const UNCLUSTERED_SOURCE_ID = 'subject-symbol-source';

const SubjectsLayer = ({ mapImages = {}, onSubjectClick }) => {
  const map = useContext(MapContext);

  const shouldSubjectsBeClustered = useSelector(selectShouldSubjectsBeClustered);
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const [mapSubjectFeatures, setMapSubjectFeatures] = useState(featureCollection([]));
  const [subjectLayerIds, setSubjectLayerIds] = useState([]);

  const onInit = useCallback(() => setSubjectLayerIds([
    SUBJECT_SYMBOLS,
    `${SUBJECT_SYMBOLS}-labels`,
    `${SUBJECT_SYMBOLS}-unclustered`,
    `${SUBJECT_SYMBOLS}-unclustered-labels`,
  ]), []);

  useEffect(() => {
    if (subjectFeatureCollection?.features?.length) {
      addFeatureCollectionImagesToMap(subjectFeatureCollection);
    }
  }, [subjectFeatureCollection]);

  useEffect(() => {
    setMapSubjectFeatures({ ...subjectFeatureCollection });
  }, [mapImages, subjectFeatureCollection]);

  // When an unclustered symbol source's data shrinks (e.g. "Clear All" or clearing a
  // subject group), Mapbox keeps the previously rendered symbol bucket on screen — the
  // removed icons linger until something forces the layer to re-lay-out, which is why a
  // pan/zoom makes them disappear. Updating the source data, repainting, and forcing a
  // placement pass all fail to rebuild the bucket; toggling the layer's visibility does.
  // So, once the source has finished reloading the smaller dataset, briefly toggle the
  // unclustered subject layers' visibility to force the rebuild without moving the camera.
  // Clustered subjects render as DOM markers, which update immediately, so this only
  // applies when clustering is off.
  const previousSubjectCountRef = useRef(0);
  useEffect(() => {
    const currentCount = mapSubjectFeatures.features?.length ?? 0;
    const didShrink = currentCount < previousSubjectCountRef.current;
    previousSubjectCountRef.current = currentCount;

    if (!didShrink || !map || shouldSubjectsBeClustered) return;

    const rebuildLayers = () => [UNCLUSTERED_LAYER_ID, `${UNCLUSTERED_LAYER_ID}-labels`].forEach((layerId) => {
      // Preserve the layer's current visibility (a user may have name labels turned off);
      // a hidden layer has nothing stale to clear, so skip it.
      if (map.getLayer(layerId) && map.getLayoutProperty(layerId, 'visibility') !== 'none') {
        map.setLayoutProperty(layerId, 'visibility', 'none');
        map.setLayoutProperty(layerId, 'visibility', 'visible');
      }
    });

    const onSourceData = (event) => {
      if (event.sourceId === UNCLUSTERED_SOURCE_ID && event.isSourceLoaded) {
        map.off('sourcedata', onSourceData);
        rebuildLayers();
      }
    };
    map.on('sourcedata', onSourceData);
    return () => map.off('sourcedata', onSourceData);
  }, [map, mapSubjectFeatures, shouldSubjectsBeClustered]);

  const onSubjectSymbolClick = useMemo(() => withMultiLayerHandlerAwareness(
    map,
    (event) => {
      const clickedLayer = map.queryRenderedFeatures(event.point, { layers: subjectLayerIds })[0];

      onSubjectClick(({ event, layer: clickedLayer }));
    }
  ), [map, onSubjectClick, subjectLayerIds]);

  useMapSources([{
    id: UNCLUSTERED_SOURCE_ID,
    data: {
      ...mapSubjectFeatures,
      features: !shouldSubjectsBeClustered ? mapSubjectFeatures.features : [],
    }
  }]);

  const subjectIconLayout = {
    'icon-image': DEFAULT_SYMBOL_LAYOUT['icon-image'],
    'icon-size': DEFAULT_SYMBOL_LAYOUT['icon-size'],
    'icon-allow-overlap': DEFAULT_SYMBOL_LAYOUT['icon-allow-overlap'],
  };

  return <>
    <LabeledPatrolSymbolLayer
      before={SKY_LAYER}
      filter={UNCLUSTERED_FILTER}
      id={UNCLUSTERED_LAYER_ID}
      layout={subjectIconLayout}
      onClick={onSubjectSymbolClick}
      onInit={onInit}
      sourceId={UNCLUSTERED_SOURCE_ID}
      type="symbol"
    />

    {!!map.getSource(CLUSTERS_SOURCE_ID) && <LabeledPatrolSymbolLayer
      before={SKY_LAYER}
      filter={CLUTERED_FILTER}
      id={SUBJECT_SYMBOLS}
      layout={subjectIconLayout}
      onClick={onSubjectSymbolClick}
      sourceId={CLUSTERS_SOURCE_ID}
      type="symbol"
    />}
  </>;
};

export default memo(withMapViewConfig(SubjectsLayer));
