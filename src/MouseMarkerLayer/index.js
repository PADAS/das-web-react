import React, { Fragment, memo } from 'react';
import { point } from '@turf/helpers';
import { Source, Layer } from 'react-mapbox-gl';

const layout = {
  'icon-image': 'marker-icon',
  'icon-allow-overlap': true,
  'icon-anchor': 'bottom',
};

const MouseMarkerLayer = ({ map, location, ...rest }) => {
  if (!location.lng || !location.lat) return null;

  const sourceData = {
    type: 'geojson',
    data: point([location.lng, location.lat]),
  };

  return <Fragment>
    <Source id='mouse-marker-source' geoJsonSource={sourceData} />
    <Layer sourceId='mouse-marker-source' type='symbol' layout={layout}  {...rest} />
  </Fragment>;

};

export default memo(MouseMarkerLayer);