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

const StaticSensorsLayer = ({ staticSensors, onStaticSensorClick }) => {
  const map = useContext(MapContext);
  const [sensorsWithDefaultValue, setSensorsWithDefaultValue] = useState({});
  const getStaticSensorLayer = (event) => map.queryRenderedFeatures(event.point)[0];

  const addDefaultStatusValue = useCallback((features = []) => {
    return features.map(feature => {
      const featureProperties = feature?.properties ?? {};
      const featureDeviceProperties = featureProperties?.device_status_properties ?? [];
      const defaultProperty = featureDeviceProperties.find(deviceProperty => deviceProperty?.default ?? false);
      const featureHasImage = !!featureProperties?.image?.length ?? false;
      const defaultStatusValue = `${!featureHasImage ? defaultProperty.label : ''} ${defaultProperty.value} ${defaultProperty.units}`;
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
    'text-offset': ['case',
      ['!=', ['get', 'image'], null],
      [
        'interpolate',
        ['linear'],
        ['length', 'image'],
        0,
        ['literal', [-3, -.2]],
        1,
        ['literal', [0, -.2]]
      ],
      ['literal', [-3, -.2]]
    ],
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
    'icon-offset': [8, -8],
    'text-offset': [3, -.3],
    'icon-anchor': 'left',
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

  const onLayerClick = (event) => onStaticSensorClick(({ event, layer: getStaticSensorLayer(event) }));

  return <>
    <GeoJsonLayer type={LAYER_TYPE} id={LAYER_ID} data={sensorsWithDefaultValue} layout={labelLayout} paint={labelPaint} onClick={onLayerClick}/>
  </>;
};

export default memo(StaticSensorsLayer);