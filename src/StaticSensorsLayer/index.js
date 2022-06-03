import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import { MapContext } from '../App';
import { LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getSubjectDefaultDeviceProperty } from '../utils/subjects';
import { showPopup } from '../ducks/popup';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';

import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';


const { STATIC_SENSOR, CLUSTERED_STATIC_SENSORS_LAYER, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;

const { SUBJECT_SYMBOLS, CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const layerFilterDefault = [
  'all',
  ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
  ['==', 'is_static', true],
  ['!has', 'point_count'],
];

const IMAGE_DATA = {
  id: 'popup-background',
  options: {
    content: [15, 9, 130, 125],
    stretchX: [[17, 46], [94, 122]],
    stretchY: [[23, 116]],
    pixelRatio: 2.7
  }
};

const layerIds = [CLUSTERED_STATIC_SENSORS_LAYER, UNCLUSTERED_STATIC_SENSORS_LAYER];

const StaticSensorsLayer = ({ staticSensors = { features: [] }, isTimeSliderActive, showMapNames, simplifyMapDataOnZoom: { enabled: isDataInMapSimplified }, showPopup }) => {
  const map = useContext(MapContext);
  const showMapStaticSubjectsNames = showMapNames[STATIC_SENSOR]?.enabled ?? false;
  const getStaticSensorLayer = useCallback((event) => map.queryRenderedFeatures(event.point)[0], [map]);
  const [layerFilter, setLayerFilter] = useState(layerFilterDefault);

  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);
  const currentSourceId = shouldSubjectsBeClustered ? CLUSTERS_SOURCE_ID : SUBJECT_SYMBOLS;
  const [currentLayerId, currentInactiveLayerId] = shouldSubjectsBeClustered ? [layerIds[0], layerIds[1]] :[layerIds[1], layerIds[0]];
  const currentBackgroundLayerId = `${currentLayerId}_BACKGROUND`;


  const addDefaultStatusValue = useCallback((feature) => {
    const { properties } = feature;
    const defaultProperty = getSubjectDefaultDeviceProperty(feature);

    let featureWithDefaultValue;
    featureWithDefaultValue =  set(feature, 'properties.data_map_id_simplified', isDataInMapSimplified);
    featureWithDefaultValue =  set(feature, 'properties.show_map_names', showMapStaticSubjectsNames);

    if (!isEmpty(defaultProperty)) {
      const propertyUnitsLabel = JSON.parse(JSON.stringify(defaultProperty.units)) ? ` ${defaultProperty.units}` : '';
      featureWithDefaultValue = set(feature, 'properties.default_status_value', isTimeSliderActive ? 'No historical data' : `${defaultProperty.value}${propertyUnitsLabel}`);
    };

    if (!properties?.image?.length) {
      featureWithDefaultValue =  set(feature, 'properties.default_status_label', defaultProperty.label) ;
    }

    return featureWithDefaultValue;
  }, [isDataInMapSimplified, isTimeSliderActive, showMapStaticSubjectsNames]);

  useEffect(() => {
    if (!!staticSensors?.features?.length) {
      addFeatureCollectionImagesToMap(staticSensors, { sdf: true });
    }
  }, [staticSensors]);

  useEffect(() => {
    if (map) {
      map.loadImage(LayerBackground, (error, image) =>
        !error & map.addImage(IMAGE_DATA.id, image, IMAGE_DATA.options)
      );
    }
  }, [map]);

  const createPopup = useCallback((feature) => {
    const match = staticSensors.features.find(f => f.properties.id === feature.properties.id);
    const cloned = { ...match };

    const withDefaultValue = addDefaultStatusValue(cloned);

    const { geometry, properties } = withDefaultValue;

    showPopup('subject', { geometry, properties, coordinates: geometry.coordinates });

    const handleMapClick = () => {
      setLayerFilter(layerFilterDefault);
    };

    setTimeout(() => map.once('click', handleMapClick));

  }, [addDefaultStatusValue, staticSensors?.features, map, showPopup]);

  // Renderless layer to query unclustered static sensors

  useEffect(() => {
    if (map && !!map.getSource(currentSourceId)) {
      if (!map.getLayer(currentLayerId)) {
        map.addLayer({
          id: currentLayerId,
          source: currentSourceId,
          type: 'symbol',
          layout: LABELS_LAYER.layout,
          paint: LABELS_LAYER.paint,
          filter: layerFilter,
        });
        map.addLayer({
          id: currentBackgroundLayerId,
          source: currentSourceId,
          type: 'symbol',
          layout: BACKGROUND_LAYER.layout,
          paint: BACKGROUND_LAYER.paint,
          filter: layerFilter,
        }, currentLayerId);
      }
      if (map.getLayer(currentInactiveLayerId)) {
        map.removeLayer(currentInactiveLayerId);
      }
    }
  }, [map, currentInactiveLayerId, layerFilter, currentBackgroundLayerId, currentLayerId, currentSourceId]);

  useEffect(() => {
    if (map) {
      map.setFilter(currentBackgroundLayerId, layerFilter);
      map.setFilter(currentLayerId, layerFilter);
    }
  }, [layerFilter, map, currentBackgroundLayerId, currentLayerId]);

  useEffect(() => {
    const onLayerClick = (event) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [currentBackgroundLayerId] })[0];

      const newFilter = [
        ...layerFilterDefault,
        ['!=', 'id', feature.properties.id]
      ];

      setLayerFilter(newFilter);

      createPopup(feature);
    };

    const onLayerMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const onLayerMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', currentBackgroundLayerId, onLayerClick);

    map.on('mouseenter', currentBackgroundLayerId, onLayerMouseEnter);

    map.on('mouseleave', currentBackgroundLayerId, onLayerMouseLeave);

    return () => {
      map.off('click', currentBackgroundLayerId, onLayerClick);

      map.off('mouseenter', currentBackgroundLayerId, onLayerMouseEnter);

      map.off('mouseleave', currentBackgroundLayerId, onLayerMouseLeave);
    };

  }, [currentBackgroundLayerId, createPopup, map, getStaticSensorLayer]);


  return null;
};

const mapStatetoProps = (state) => ({
  showMapNames: state.view.showMapNames,
  simplifyMapDataOnZoom: state.view.simplifyMapDataOnZoom,
});

export default connect(mapStatetoProps, { showPopup })(memo(StaticSensorsLayer));

StaticSensorsLayer.propTypes = {
  staticSensors: PropTypes.object.isRequired,
  isTimeSliderActive: PropTypes.bool,
};