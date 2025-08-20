import React from 'react';

import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddItemButton from '../AddItemButton';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

const TimepointPopup = ({ data }) => <>
  <h4>{data.properties.title || data.properties.name}</h4>

  {data.properties.time && <DateTime date={data.properties.time} />}

  <GpsFormatToggle
    lngLat={{ latitude: data.geometry.coordinates[1], longitude: data.geometry.coordinates[0] }}
    name="timepointPopup-gpsFormatToggle"
  />

  <hr />

  <AddItemButton
    analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'track timepoint' }}
    reportData={{
      location: {
        latitude: data.geometry.coordinates[1],
        longitude: data.geometry.coordinates[0],
      },
      reportedById: data.properties.id,
      time: data.properties.time,
    }}
    showLabel={false}
  />
</>;

export default TimepointPopup;
