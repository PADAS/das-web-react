import React, { memo, useCallback, useEffect, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import PropTypes from 'prop-types';
import { Source } from 'react-mapbox-gl';
import { useSelector } from 'react-redux';

import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getTimeSliderState } from '../selectors';
import { LAYER_IDS, REACT_APP_ENABLE_CLUSTERING, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';

const { CLUSTERED_DATA_SOURCE_ID, SUBJECT_SYMBOLS, UNCLUSTERED_DATA_SOURCE_ID } = LAYER_IDS;

const SubjectsLayer = ({ map, mapImages, onSubjectClick }) => {
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
    if (REACT_APP_ENABLE_CLUSTERING) {
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

  return <>
    {!REACT_APP_ENABLE_CLUSTERING && <>
      <Source id='subject-symbol-source' geoJsonSource={{ type: 'geojson', data: mapSubjectFeatures }} />

      <LabeledPatrolSymbolLayer
        id={SUBJECT_SYMBOLS}
        onClick={onSubjectSymbolClick}
        onInit={setSubjectLayerIds}
        sourceId='subject-symbol-source'
        type='symbol'
      />
    </>}

    {REACT_APP_ENABLE_CLUSTERING && <>
      <LabeledPatrolSymbolLayer
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
          `${SUBJECT_SYMBOLS}-unclustered`,
          `${SUBJECT_SYMBOLS}-unclustered-labels`,
        ])}
        sourceId={CLUSTERED_DATA_SOURCE_ID}
        type="symbol"
      />

      <LabeledPatrolSymbolLayer
        filter={[
          'all',
          ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
          ['!=', 'is_static', true],
        ]}
        id={`${SUBJECT_SYMBOLS}-unclustered`}
        onClick={onSubjectSymbolClick}
        sourceId={UNCLUSTERED_DATA_SOURCE_ID}
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
