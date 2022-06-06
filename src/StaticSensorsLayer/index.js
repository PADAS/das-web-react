import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import { MapContext } from '../App';
import { LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getSubjectDefaultDeviceProperty } from '../utils/subjects';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';
import { showPopup } from '../ducks/popup';

import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';

const { CLUSTERS_SOURCE_ID, STATIC_SENSOR, SECOND_STATIC_SENSOR_PREFIX, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;

const LAYER_TYPE = 'symbol';
const SOURCE_PREFIX = `${STATIC_SENSOR}-source`;
const LAYER_ID = STATIC_SENSOR;
const PREFIX_ID = SECOND_STATIC_SENSOR_PREFIX;
const RENDER_STATIC_SENSORS_DEBOUNCE_TIME = 25;

const IMAGE_DATA = {
  id: 'popup-background',
  options: {
    content: [15, 9, 130, 125],
    stretchX: [[17, 46], [94, 122]],
    stretchY: [[23, 116]],
    pixelRatio: 2.7
  }
};

const popup = new mapboxgl.Popup({ offset: [0, 0], anchor: 'bottom', closeButton: false });

const renderStaticSensors = (
  clickedLayerID,
  createLayer,
  isTimeSliderActive,
  map,
  onLayerClick,
  sensorsWithDefaultValue,
  setLayerVisibility,
  shouldSubjectsBeClustered
) => {
  if (map) {
    let renderedStaticSensors = [];
    if (shouldSubjectsBeClustered && map.getLayer(UNCLUSTERED_STATIC_SENSORS_LAYER)) {
      renderedStaticSensors = map
        .queryRenderedFeatures({ layers: [UNCLUSTERED_STATIC_SENSORS_LAYER] })
        .map((feature) => feature?.properties?.id);
    }

    sensorsWithDefaultValue?.features?.forEach((feature, index) => {
      const layerID = `${LAYER_ID}${feature.properties.id}`;
      const sourceId = `${SOURCE_PREFIX}-${feature.properties.id}`;
      const sourceData = { ...sensorsWithDefaultValue, features: [sensorsWithDefaultValue.features[index]] };
      const source = map.getSource(sourceId);

      if (shouldSubjectsBeClustered
        && !renderedStaticSensors.includes(feature.properties.id)
        && !isTimeSliderActive) {
        return map.getLayer(layerID) && setLayerVisibility(layerID, false);
      }

      if (source) {
        source.setData(sourceData);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: sourceData,
        });
      }

      if (map.getLayer(layerID)) return (!popup.isOpen() && clickedLayerID !== layerID) && setLayerVisibility(layerID);

      createLayer(layerID, sourceId, BACKGROUND_LAYER.layout, BACKGROUND_LAYER.paint);
      createLayer(`${PREFIX_ID}${layerID}`, sourceId, LABELS_LAYER.layout, LABELS_LAYER.paint);
      map.on('click', layerID, onLayerClick);
    });
  }
};

const debouncedRenderStaticSensors = debounce(renderStaticSensors, RENDER_STATIC_SENSORS_DEBOUNCE_TIME);

const StaticSensorsLayer = ({
  staticSensors = {},
  isTimeSliderActive,
  shouldSubjectsBeClustered,
  showMapNames,
  showPopup,
  simplifyMapDataOnZoom: { enabled: isDataInMapSimplified },
}) => {
  const map = useContext(MapContext);
  const showMapStaticSubjectsNames = showMapNames[STATIC_SENSOR]?.enabled ?? false;
  const [clickedLayerID, setClickedLayerID] = useState('');
  const [sensorsWithDefaultValue, setSensorsWithDefaultValue] = useState({});
  const getStaticSensorLayer = useCallback((event) => map.queryRenderedFeatures(event.point)[0], [map]);

  const addDefaultStatusValue = useCallback((features = []) => {
    return features.map(feature => {
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
    });
  }, [isDataInMapSimplified, isTimeSliderActive, showMapStaticSubjectsNames]);

  useEffect(() => {
    setSensorsWithDefaultValue({ ...staticSensors, ...{ features: addDefaultStatusValue(staticSensors.features) } });
  }, [addDefaultStatusValue, staticSensors]);

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

  const setLayerVisibility = useCallback((layerID, isVisible = true) => {
    const backgroundLayerID = layerID.replace(PREFIX_ID, '');
    const visibility = isVisible ? 'visible' : 'none';
    if (map.getLayer(backgroundLayerID)) {
      map.setLayoutProperty(backgroundLayerID, 'visibility', visibility);
      map.setLayoutProperty(`${PREFIX_ID}${backgroundLayerID}`, 'visibility', visibility);
    }
  }, [map]);

  const showPopupForStationarySubject = useCallback((layer) => {
    const { geometry, properties } = layer;

    const handleMapClick = () => {
      setClickedLayerID('');
      setLayerVisibility(layer.layer.id);
    };

    showPopup('subject', { geometry, properties, coordinates: geometry.coordinates });
    setTimeout(() => map.once('click', handleMapClick));

  }, [map, setLayerVisibility, showPopup]);

  const onLayerClick = useCallback((event) => {
    if (event?.originalEvent?.cancelBubble) return;

    event?.preventDefault();
    event?.originalEvent?.stopPropagation();

    const clickedLayer = getStaticSensorLayer(event);

    const clickedLayerID = clickedLayer.layer.id;
    setClickedLayerID(clickedLayerID.replace(PREFIX_ID, ''));
    showPopupForStationarySubject(clickedLayer);
    setLayerVisibility(clickedLayerID, false);
  }, [getStaticSensorLayer, showPopupForStationarySubject, setClickedLayerID, setLayerVisibility]);

  const createLayer = useCallback((layerID, sourceId, layout, paint) => {
    if (!map.getLayer(layerID)) {
      map.addLayer({
        id: layerID,
        source: sourceId,
        type: LAYER_TYPE,
        layout: layout,
        paint: paint
      });

      map.on('mouseenter', layerID, () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', layerID, () => map.getCanvas().style.cursor = '');
    }
  }, [map]);

  const debouncedRenderStaticSensorsCallback = useCallback(() => {
    debouncedRenderStaticSensors(
      clickedLayerID,
      createLayer,
      isTimeSliderActive,
      map,
      onLayerClick,
      sensorsWithDefaultValue,
      setLayerVisibility,
      shouldSubjectsBeClustered
    );
  }, [
    clickedLayerID,
    createLayer,
    isTimeSliderActive,
    map,
    onLayerClick,
    sensorsWithDefaultValue,
    setLayerVisibility,
    shouldSubjectsBeClustered,
  ]);

  useEffect(() => {
    debouncedRenderStaticSensorsCallback();
  }, [debouncedRenderStaticSensorsCallback, isDataInMapSimplified]);

  // Renderless layer to query unclustered static sensors
  useEffect(() => {
    if (map
      && !!map.getSource(CLUSTERS_SOURCE_ID)
      && !map.getLayer(UNCLUSTERED_STATIC_SENSORS_LAYER)) {
      map.addLayer({
        id: UNCLUSTERED_STATIC_SENSORS_LAYER,
        source: CLUSTERS_SOURCE_ID,
        type: 'circle',
        paint: { 'circle-radius': 0 },
        filter: [
          'all',
          ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
          ['==', 'is_static', true],
          ['!has', 'point_count'],
        ],
      });
    }
  }, [map]);

  return null;
};

const mapStatetoProps = (state) => ({
  shouldSubjectsBeClustered: getShouldSubjectsBeClustered(state),
  showMapNames: state.view.showMapNames,
  simplifyMapDataOnZoom: state.view.simplifyMapDataOnZoom,
});

export default connect(mapStatetoProps, { showPopup })(memo(StaticSensorsLayer));

StaticSensorsLayer.propTypes = {
  staticSensors: PropTypes.object.isRequired,
  isTimeSliderActive: PropTypes.bool,
};