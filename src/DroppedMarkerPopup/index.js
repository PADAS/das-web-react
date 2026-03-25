import React, { memo, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { hidePopup } from '../ducks/popup';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddItemButton from '../AddItemButton';
import GpsFormatToggle from '../GpsFormatToggle';

const DroppedMarkerPopup = ({ data: { location }, id }) => {
  const dispatch = useDispatch();

  const onComplete = useCallback(() => dispatch(hidePopup(id)), [dispatch, id]);

  return <>
    <GpsFormatToggle
      lngLat={{ latitude: location.lat, longitude: location.lng }}
      name="droppedMarkerPopup-gpsFormatToggle"
    />

    <hr />

    <AddItemButton
      analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'marker on map' }}
      formProps={{ onSaveError: onComplete, onSaveSuccess: onComplete }}
      reportData={{
        location: {
          latitude: location.lat,
          longitude: location.lng,
        }
      }}
      showLabel={false}
    />
  </>;
};

export default memo(DroppedMarkerPopup);
