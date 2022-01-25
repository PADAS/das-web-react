import React, { useCallback, useContext, useEffect, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import { useSelector } from 'react-redux';

import { addFeatureCollectionImagesToMap } from '../../utils/map';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../../selectors/subjects';
import {
  LAYER_IDS,
  SUBJECT_FEATURE_CONTENT_TYPE,
  REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING,
} from '../../constants';
import { MapContext } from '../../App';

import LabeledPatrolSymbolLayer from '../../LabeledPatrolSymbolLayer';

const { SUBJECT_SYMBOLS, SUBJECTS_AND_EVENTS_SOURCE_ID } = LAYER_IDS;

export default (mapImages, onSubjectClick) => {
  const map = useContext(MapContext);

  const subjectFeatureCollection = useSelector((state) => getMapSubjectFeatureCollectionWithVirtualPositioning(state));

  const [mapSubjectFeatures, setMapSubjectFeatures] = useState(featureCollection([]));
  const [subjectLayerIds, setSubjectLayerIds] = useState([]);

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

  const renderedSubjectsLayer = <LabeledPatrolSymbolLayer
    {...(REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING ? {
      filter: [
        'all',
        ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
        ['!=', 'is_static', true],
        ['!has', 'point_count']
    ] } : {})}
    id={SUBJECT_SYMBOLS}
    onClick={onSubjectSymbolClick}
    onInit={setSubjectLayerIds}
    sourceId={REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING
      ? SUBJECTS_AND_EVENTS_SOURCE_ID : 'subject-symbol-source'}
    type="symbol"
  />;

  return { mapSubjectFeatures, renderedSubjectsLayer };
};
