import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import store from '../store';
import { MapContext } from '../App';
import { LAYER_IDS } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';
import SubjectPopup from '../SubjectPopup';

const { STATIC_SENSOR, SECOND_STATIC_SENSOR_PREFIX } = LAYER_IDS;

const LAYER_TYPE = 'symbol';
const SOURCE_PREFIX = `${STATIC_SENSOR}-source`;
const LAYER_ID = STATIC_SENSOR;
const PREFIX_ID = SECOND_STATIC_SENSOR_PREFIX;

const IMAGE_DATA = {
  id: 'popup-background',
  options: {
    content: [15, 9, 130, 125],
    stretchX: [[17, 46], [94, 122]],
    stretchY: [[23, 116]],
    pixelRatio: 2.7
  }
};

const StaticSensorsLayer = ({ staticSensors }) => {
  const map = useContext(MapContext);
  const [sensorsWithDefaultValue, setSensorsWithDefaultValue] = useState({});
  const getStaticSensorLayer = useCallback((event) => map.queryRenderedFeatures(event.point)[0], [map]);

  const addDefaultStatusValue = useCallback((features = []) => {
    return features.map(feature => {
      const featureProperties = feature?.properties ?? {};
      const featureDeviceProperties = featureProperties?.device_status_properties ?? [];
      const defaultProperty = featureDeviceProperties.find(deviceProperty => deviceProperty?.default ?? false);

      if (isEmpty(defaultProperty)) return feature;

      let featureWithDefaultValue = set(feature, 'properties.default_status_value', `${defaultProperty.value} ${defaultProperty.units}`);
      const featureHasImage = !!featureProperties?.image?.length ?? false;
      if (!featureHasImage) {
        featureWithDefaultValue =  set(feature, 'properties.default_status_label', defaultProperty.label);
      }
      return featureWithDefaultValue;
    });
  }, []);

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
      map.loadImage(LayerBackground, (error, image) => {
        if (error) throw error;
        if (!map.hasImage(IMAGE_DATA.id)) {
          map.addImage(IMAGE_DATA.id, image, IMAGE_DATA.options);
        }
      });
    }
  }, [map]);

  const changeLayersVisibility = useCallback((layerID, visibility) => {
    const backgroundLayerID = layerID.replace(PREFIX_ID, '');
    if (map.getLayer(backgroundLayerID)) {
      map.setLayoutProperty(backgroundLayerID, 'visibility', visibility);
      map.setLayoutProperty(`${PREFIX_ID}${backgroundLayerID}`, 'visibility', visibility);
    }
  }, [map]);

  const createPopup = useCallback((layer) => {
    const { geometry } = layer;

    const elementContainer = document.createElement('div');
    ReactDOM.render(<Provider store={store}>
      <SubjectPopup data={layer} map={map}/>
    </Provider>, elementContainer);

    const popup = new mapboxgl.Popup({ offset: [0, 0], anchor: 'bottom' })
      .setLngLat(geometry.coordinates)
      .setDOMContent(elementContainer)
      .addTo(map);

    popup.on('close', () => {
      changeLayersVisibility(layer.layer.id, 'visible');
    });
  }, [changeLayersVisibility, map]);

  const onLayerClick = useCallback((event) => {
    const clickedLayer = getStaticSensorLayer(event);
    const clickedLayerID = clickedLayer.layer.id;
    createPopup(clickedLayer);
    changeLayersVisibility(clickedLayerID, 'none');
  }, [changeLayersVisibility, createPopup, getStaticSensorLayer]);

  const createLayer = useCallback((layerID, sourceId, layout, paint) => {
    if (!map.getLayer(layerID)) {
      map.addLayer({
        id: layerID,
        source: sourceId,
        type: LAYER_TYPE,
        layout: layout,
        paint: paint
      });
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      sensorsWithDefaultValue?.features?.forEach((feature, index) => {
        const sourceId = `${SOURCE_PREFIX}-${feature.properties.id}`;
        const sourceData = { ...sensorsWithDefaultValue, features: [sensorsWithDefaultValue.features[index]] };
        const source = map.getSource(sourceId);

        if (source) {
          source.setData(sourceData);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: sourceData,
          });
        }

        const layerID = `${LAYER_ID}${feature.properties.id}`;
        if (!map.getLayer(layerID)) {
          createLayer(layerID, sourceId, BACKGROUND_LAYER.layout, BACKGROUND_LAYER.paint);
          createLayer(`${PREFIX_ID}${layerID}`, sourceId, LABELS_LAYER.layout, LABELS_LAYER.paint);
          map.on('click', layerID, onLayerClick);
        }
      });
    }
  }, [createLayer, map, onLayerClick, sensorsWithDefaultValue]);

  return null;
};

export default memo(StaticSensorsLayer);