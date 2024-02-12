import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';
import { LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { MapContext } from '../App';
import { useMapSource } from '../hooks';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';

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
  ['!=', 'is_static', true],
];

const UNCLUSTERED_LAYER_ID = `${SUBJECT_SYMBOLS}-unclustered`;
const UNCLUSTERED_SOURCE_ID = 'subject-symbol-source';

const SubjectsLayer = ({ mapImages, onSubjectClick }) => {
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

  useMapSource(UNCLUSTERED_SOURCE_ID, {
    ...mapSubjectFeatures,
    features: !shouldSubjectsBeClustered ? mapSubjectFeatures.features : [],
  });

  return <>
    <LabeledPatrolSymbolLayer
      before={SKY_LAYER}
      filter={UNCLUSTERED_FILTER}
      id={UNCLUSTERED_LAYER_ID}
      onClick={onSubjectSymbolClick}
      onInit={onInit}
      sourceId={UNCLUSTERED_SOURCE_ID}
      type="symbol"
    />

    {!!map.getSource(CLUSTERS_SOURCE_ID) && <LabeledPatrolSymbolLayer
      before={SKY_LAYER}
      filter={CLUTERED_FILTER}
      id={SUBJECT_SYMBOLS}
      onClick={onSubjectSymbolClick}
      sourceId={CLUSTERS_SOURCE_ID}
      type="symbol"
    />}
  </>;
};

SubjectsLayer.defaultProps = {
  mapImages: {},
};

SubjectsLayer.propTypes = {
  mapImages: PropTypes.object,
  onSubjectClick: PropTypes.func.isRequired,
};

export default memo(withMapViewConfig(SubjectsLayer));
