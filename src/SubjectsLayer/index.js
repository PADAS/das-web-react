import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';
import { LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { MapContext } from '../App';
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

  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);
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
    if (!!subjectFeatureCollection?.features?.length) {
      addFeatureCollectionImagesToMap(subjectFeatureCollection);
    }
  }, [subjectFeatureCollection]);

  useEffect(() => {
    setMapSubjectFeatures({ ...subjectFeatureCollection });
  }, [mapImages, subjectFeatureCollection]);

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

  // Override icon-image and icon-size for ropeless_buoy_gearset subjects to use za-provincial-2
  // Note: icon-allow-overlap and icon-ignore-placement don't support data expressions,
  // so we set them globally to ensure buoys are always visible
  const buoyIconLayout = {
    'icon-image': [
      'case',
      ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'], 'za-provincial-2',
      ['concat',
        ['get', 'image'], '-',
        ['case',
          ['has', 'width'], ['get', 'width'],
          'x'],
        '-',
        ['case',
          ['has', 'height'], ['get', 'height'],
          'x'],
      ]
    ],
    'icon-size': [
      'interpolate', ['exponential', 0.5], ['zoom'],
      0, ['case', ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'], 0.75, ['case', ['in', 'generic', ['get', 'image']], 0.1 / 3, 0.2 / 3]],
      11, ['case', ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'], 0.925, ['case', ['in', 'generic', ['get', 'image']], 0.4 / 3, 0.8 / 3]],
      14, ['case', ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'], 1.25, ['case', ['in', 'generic', ['get', 'image']], 0.5 / 3, 1 / 3]]
    ],
    'icon-allow-overlap': true,
    'icon-ignore-placement': true
  };

  const buoyTextPaint = {
    'text-opacity': [
      'case',
      ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'], 0,
      1
    ],
    'icon-opacity': [
      'case',
      ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'], 0,
      0.5
    ]
  };

  return <>
    <LabeledPatrolSymbolLayer
      before={SKY_LAYER}
      filter={UNCLUSTERED_FILTER}
      id={UNCLUSTERED_LAYER_ID}
      layout={buoyIconLayout}
      onClick={onSubjectSymbolClick}
      onInit={onInit}
      sourceId={UNCLUSTERED_SOURCE_ID}
      textPaint={buoyTextPaint}
      type="symbol"
    />

    {!!map.getSource(CLUSTERS_SOURCE_ID) && <LabeledPatrolSymbolLayer
      before={SKY_LAYER}
      filter={CLUTERED_FILTER}
      id={SUBJECT_SYMBOLS}
      layout={buoyIconLayout}
      onClick={onSubjectSymbolClick}
      sourceId={CLUSTERS_SOURCE_ID}
      textPaint={buoyTextPaint}
      type="symbol"
    />}
  </>;
};

export default memo(withMapViewConfig(SubjectsLayer));
