import React from 'react';

import { point } from '@turf/helpers';

import { GeoJSONLayer } from 'react-mapbox-gl';


const MouseMarkerLayer = ({ map, location, ...rest }) => {
  if (!location.lng || !location.lat) return null;
  const pointFeature = point([location.lng, location.lat]);
  return <GeoJSONLayer
    data={pointFeature}
    symbolLayout={{
      'icon-image': 'marker-icon',
      'icon-allow-overlap': true,
    }} 
    {...rest}
  />;
};

export default MouseMarkerLayer;