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
    content: [26, 9, 110, 47],
    stretchX: [[29, 53], [83, 110]],
    stretchY: [[28, 30]],
    pixelRatio: 1.7
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
      const defaultStatusValue = `${!featureHasImage ? defaultProperty.label + ' ': ''}${defaultProperty.value} ${defaultProperty.units}`;
      return set(feature, 'properties.default_status_value', defaultStatusValue);
    });
  }, []);


  useEffect(() => {
    setSensorsWithDefaultValue({ ...staticSensors, ...{ features: addDefaultStatusValue(staticSensors.features) } });
  }, [addDefaultStatusValue, staticSensors]);

  const labelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-size': 1.1,
    'icon-anchor': 'bottom',
    'text-anchor': 'center',
    'text-justify': 'left',
    'text-offset': [.6, -2.5],
    'icon-text-fit-padding': [2.5, 2, -1.5, 22],
    'text-field': '{default_status_value}',
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
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
    'icon-offset': [-30, -27],
    'text-offset': ['case',
      ['!=', ['get', 'image'], null],
      [
        'interpolate',
        ['linear'],
        ['length', 'image'],
        0,
        ['literal', [-2, -3.3]],
        1,
        ['literal', [-.8, -3.3]]
      ],
      ['literal', [-2, -3.3]]
    ],

    'icon-anchor': 'left',
    'text-anchor': 'center',
    'text-justify': 'left',
    'text-field': '{default_status_value}',
  };

  const secondLabelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'text-color': '#ffffff',
    'icon-color': '#ffffff',
    'text-halo-width': 0,
    'icon-halo-width': 0,
    'text-translate': [27, 0],
    'icon-translate': [-20, -30],
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