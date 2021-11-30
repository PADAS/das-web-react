import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import set from 'lodash/set';

import { MapContext } from '../App';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';

import GeoJsonLayer from '../GeoJsonLayer';
import LayerBackground from '../common/images/sprites/layer-background-sprite.png';

const LAYER_TYPE = 'symbol';
const LAYER_ID = 'static_sensors_layer';
const IMAGE_DATA = {
  id: 'popup-background',
  options: {
    content: [15, 15, 55, 45],
    stretchX: [[15, 15], [45, 55]],
    stretchY: [[23, 24]],
    pixelRatio: 1.6
  }
};

const StaticSensorsLayer = ({ staticSensors }) => {
  const map = useContext(MapContext);
  const [sensorsWithDefaultValue, setSensorsWithDefaultValue] = useState({});

  const addDefaultStatusValue = useCallback((features = []) => {
    return features.map(feature => {
      const featureDeviceProperties = feature?.properties?.device_status_properties ?? [];
      const defaultProperty = featureDeviceProperties.find(deviceProperty => deviceProperty?.default ?? false);
      const defaultStatusValue = `${defaultProperty.value} ${defaultProperty.units}`;
      // concat values of the properties
      return set(feature, 'properties.default_status_value', defaultStatusValue);
    });
  }, []);


  useEffect(() => {
    setSensorsWithDefaultValue({ ...staticSensors, ...{ features: addDefaultStatusValue(staticSensors.features) } });
  }, [addDefaultStatusValue, staticSensors]);

  const labelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-size': 1,
    'text-anchor': 'left',
    'text-offset': [-2.5, -.2],
    'text-field': '{default_status_value}',
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    'icon-text-fit-padding': [0, 0, 0, 0],
    'icon-text-fit': 'both',
    'icon-image': 'popup-background',
  };

  const labelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'text-color': 'rgba(0,0,0,0.1)',
    'text-halo-width': 0
  };

  const secondLabelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-offset': [0, -8],
    'text-offset': [.5, -.3],
    'icon-anchor': 'right',
    'text-anchor': 'left',
    'text-justify': 'left',
    'text-field': '{default_status_value}',
  };

  const secondLabelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'text-color': '#ffffff',
    'icon-color': '#ffffff',
    'text-halo-width': 0
  };

  useEffect(() => {
    if (!!staticSensors?.features?.length) {
      addFeatureCollectionImagesToMap(staticSensors, map, { sdf: true });
    }
  }, [map, staticSensors]);

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

  useEffect(() => {
    if (map) {
      const sourceId = `source-${LAYER_ID}`;
      const source = map.getSource(sourceId);
      const layer = map.getLayer(`second_${LAYER_ID}`);
      if (source && !layer) {
        map.addLayer({
          id: `second_${LAYER_ID}`,
          source: sourceId,
          type: LAYER_TYPE,
          layout: secondLabelLayout,
          paint: secondLabelPaint,
        });
      }
    }
  }, [labelLayout, labelPaint, map, secondLabelLayout, secondLabelPaint]);

  return <>
    <GeoJsonLayer type={LAYER_TYPE} id={LAYER_ID} data={sensorsWithDefaultValue} layout={labelLayout} paint={labelPaint}/>
  </>;
};

export default memo(StaticSensorsLayer);