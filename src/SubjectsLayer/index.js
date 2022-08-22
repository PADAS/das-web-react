import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';
import { useMapSource } from '../hooks';

const { SUBJECT_SYMBOLS } = LAYER_IDS;
const { CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const unclusteredFilter = [
  'all',
  ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
  ['!=', 'is_static', true],
];

const clusteredFilter = [
  'all',
  ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
  ['!=', 'is_static', true],
  ['!has', 'point_count']
];

const UNCLUSTERED_SOURCE_ID = 'subject-symbol-source';
const UNCLUSTERED_LAYER_ID = `${SUBJECT_SYMBOLS}-unclustered`;

const SubjectsLayer = ({ map, mapImages, onSubjectClick }) => {
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);
  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);

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
  }, [subjectFeatureCollection, mapImages]);

  const onSubjectSymbolClick = useCallback((event) => {
    const clickedLayer = map.queryRenderedFeatures(event.point, { layers: subjectLayerIds })[0];
    onSubjectClick(({ event, layer: clickedLayer }));
  }, [subjectLayerIds, map, onSubjectClick]);


  const unclusteredData = useMemo(() => ({
    ...mapSubjectFeatures,
    features: !shouldSubjectsBeClustered ? mapSubjectFeatures.features : [],
  }), [mapSubjectFeatures, shouldSubjectsBeClustered]);

  useMapSource(UNCLUSTERED_SOURCE_ID, unclusteredData);

  return <>
    <LabeledPatrolSymbolLayer
      filter={unclusteredFilter}
      id={UNCLUSTERED_LAYER_ID}
      onClick={onSubjectSymbolClick}
      onInit={onInit}
      sourceId={UNCLUSTERED_SOURCE_ID}
      type="symbol"
    />

    {!!map.getSource(CLUSTERS_SOURCE_ID) && <>
      <LabeledPatrolSymbolLayer
        filter={clusteredFilter}
        id={SUBJECT_SYMBOLS}
        onClick={onSubjectSymbolClick}
        sourceId={CLUSTERS_SOURCE_ID}
        type="symbol"
      />
    </>}
  </>;
};

SubjectsLayer.defaultProps = { mapImages: {} };

SubjectsLayer.propTypes = {
  map: PropTypes.object.isRequired,
  mapImages: PropTypes.object,
  onSubjectClick: PropTypes.func.isRequired,
};

export default withMap(memo(withMapViewConfig(SubjectsLayer)));
