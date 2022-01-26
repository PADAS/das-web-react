import React, { useCallback, useContext, useEffect, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import { useSelector } from 'react-redux';

import { addFeatureCollectionImagesToMap } from '../../utils/map';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../../selectors/subjects';
import { getTimeSliderState } from '../../selectors';
import {
  LAYER_IDS,
  SUBJECT_FEATURE_CONTENT_TYPE,
  REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING,
} from '../../constants';
import { MapContext } from '../../App';

import LabeledPatrolSymbolLayer from '../../LabeledPatrolSymbolLayer';

const { SUBJECT_SYMBOLS, SUBJECTS_AND_EVENTS_SOURCE_ID, SUBJECTS_AND_EVENTS_UNCLUSTERED_SOURCE_ID } = LAYER_IDS;

export default (mapImages, onSubjectClick) => {
  const map = useContext(MapContext);

  const isTimeSliderActive = useSelector((state) => getTimeSliderState(state).active);
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

  useEffect(() => {
    if (REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING) {
      map.setLayoutProperty(SUBJECT_SYMBOLS, 'visibility', isTimeSliderActive ? 'none' : 'visible');
      map.setLayoutProperty(`${SUBJECT_SYMBOLS}-labels`, 'visibility', isTimeSliderActive ? 'none' : 'visible');
      map.setLayoutProperty(`${SUBJECT_SYMBOLS}-unclustered`, 'visibility', isTimeSliderActive ? 'visible' : 'none');
      map.setLayoutProperty(`${SUBJECT_SYMBOLS}-unclustered-labels`, 'visibility', isTimeSliderActive ? 'visible' : 'none');
    }
  }, [isTimeSliderActive, map, mapSubjectFeatures]);

  const onSubjectSymbolClick = useCallback((event) => {
    const clickedLayer = map.queryRenderedFeatures(event.point, { layers: subjectLayerIds })[0];
    onSubjectClick(({ event, layer: clickedLayer }));
  }, [subjectLayerIds, map, onSubjectClick]);

  const renderedSubjectsLayer = <>
    {REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING && <LabeledPatrolSymbolLayer
      filter={[
        'all',
        ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
        ['!=', 'is_static', true],
        ['!has', 'point_count']
      ]}
      id={SUBJECT_SYMBOLS}
      onClick={onSubjectSymbolClick}
      onInit={() => setSubjectLayerIds([
        SUBJECT_SYMBOLS,
        `${SUBJECT_SYMBOLS}-labels`,
        ...(REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING
          ? [`${SUBJECT_SYMBOLS}-unclustered`, `${SUBJECT_SYMBOLS}-unclustered-labels`]
          : [])
      ])}
      sourceId={SUBJECTS_AND_EVENTS_SOURCE_ID}
      type="symbol"
    />}

    <LabeledPatrolSymbolLayer
      filter={[
        'all',
        ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
        ['!=', 'is_static', true],
      ]}
      id={REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING ? `${SUBJECT_SYMBOLS}-unclustered` : SUBJECT_SYMBOLS}
      onClick={onSubjectSymbolClick}
      sourceId={REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING
        ? SUBJECTS_AND_EVENTS_UNCLUSTERED_SOURCE_ID : 'subject-symbol-source'}
      type="symbol"
    />
  </>;

  return { mapSubjectFeatures, renderedSubjectsLayer };
};
