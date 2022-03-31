import React, { memo, useCallback, useEffect, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import PropTypes from 'prop-types';
import { Source } from 'react-mapbox-gl';
import { useSelector } from 'react-redux';

import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { DEVELOPMENT_FEATURE_FLAGS, LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';

const { ENABLE_NEW_CLUSTERING } = DEVELOPMENT_FEATURE_FLAGS;

const { CLUSTERS_SOURCE_ID, SUBJECT_SYMBOLS } = LAYER_IDS;

const SubjectsLayer = ({ map, mapImages, onSubjectClick }) => {
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);
  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);

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

  const sourceData = {
    type: 'geojson',
    data: {
      ...mapSubjectFeatures,
      features: !shouldSubjectsBeClustered ? mapSubjectFeatures.features : [],
    },
  };

  return <>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />

    <LabeledPatrolSymbolLayer
      filter={[
        'all',
        ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
        ['!=', 'is_static', true],
      ]}
      id={`${SUBJECT_SYMBOLS}-unclustered`}
      onClick={onSubjectSymbolClick}
      onInit={ENABLE_NEW_CLUSTERING ? () => setSubjectLayerIds([
        SUBJECT_SYMBOLS,
        `${SUBJECT_SYMBOLS}-labels`,
        `${SUBJECT_SYMBOLS}-unclustered`,
        `${SUBJECT_SYMBOLS}-unclustered-labels`,
      ]) : setSubjectLayerIds}
      sourceId="subject-symbol-source"
      type="symbol"
    />

    {ENABLE_NEW_CLUSTERING && !!map.getSource(CLUSTERS_SOURCE_ID) && <>
      <LabeledPatrolSymbolLayer
        filter={[
          'all',
          ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
          ['!=', 'is_static', true],
          ['!has', 'point_count']
        ]}
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
