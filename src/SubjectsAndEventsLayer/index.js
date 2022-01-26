import React, { useContext, useEffect } from 'react';
import debounceRender from 'react-debounce-render';
import PropTypes from 'prop-types';

import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS } from '../constants';
import { MapContext } from '../App';
import useEventsLayer from '../hooks/useEventsLayer';
import useSubjectsLayer from '../hooks/useSubjectsLayer';
import withMapViewConfig from '../WithMapViewConfig';

import useClustersLayer from './useClustersLayer';
import useUnclusteredStaticSensorsLayer from './useUnclusteredStaticSensorsLayer';

const { SUBJECTS_AND_EVENTS_SOURCE_ID, SUBJECTS_AND_EVENTS_UNCLUSTERED_SOURCE_ID } = LAYER_IDS;

const SOURCE_CONFIGURATION = {
  cluster: true,
  clusterMaxZoom: CLUSTERS_MAX_ZOOM,
  clusterRadius: CLUSTERS_RADIUS,
  type: 'geojson',
};

const SubjectsAndEventsLayer = ({
  bounceEventIDs = [],
  mapEventsUserLayoutConfig,
  mapImages,
  minZoom,
  onEventClick,
  onSubjectClick,
}) => {
  const map = useContext(MapContext);

  const source = map.getSource(SUBJECTS_AND_EVENTS_SOURCE_ID);
  const nonClusteredSource = map.getSource(SUBJECTS_AND_EVENTS_UNCLUSTERED_SOURCE_ID);

  const {
    mapEventFeatures,
    renderedEventsLayer,
  } = useEventsLayer(bounceEventIDs, false, mapEventsUserLayoutConfig, mapImages, minZoom, onEventClick);

  const { mapSubjectFeatures, renderedSubjectsLayer } = useSubjectsLayer(mapImages, onSubjectClick);

  const { updateClusterMarkers } = useClustersLayer(onEventClick, onSubjectClick, source);

  useUnclusteredStaticSensorsLayer(source);

  useEffect(() => {
    if (map) {
      const sourceData = {
        features: [...mapEventFeatures.features, ...mapSubjectFeatures.features],
        type: 'FeatureCollection',
      };
      if (source) {
        source.setData(sourceData);
        nonClusteredSource.setData(sourceData);
      } else {
        map.addSource(SUBJECTS_AND_EVENTS_SOURCE_ID, { ...SOURCE_CONFIGURATION, data: sourceData });
        map.addSource(SUBJECTS_AND_EVENTS_UNCLUSTERED_SOURCE_ID, { data: sourceData, type: 'geojson' });
      }

      updateClusterMarkers();
    }
  }, [map, mapEventFeatures.features, mapSubjectFeatures.features, nonClusteredSource, source, updateClusterMarkers]);

  return <>
    {renderedEventsLayer}
    {renderedSubjectsLayer}
  </>;
};

SubjectsAndEventsLayer.propTypes = {
  bounceEventIDs: PropTypes.string,
  mapEventsUserLayoutConfig: PropTypes.object,
  mapImages: PropTypes.object,
  minZoom: PropTypes.number,
  onEventClick: PropTypes.func.isRequired,
  onSubjectClick: PropTypes.func.isRequired,
};

export default debounceRender(withMapViewConfig(SubjectsAndEventsLayer), 16.6666);
