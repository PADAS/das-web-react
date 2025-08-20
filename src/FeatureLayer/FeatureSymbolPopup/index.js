import React, { memo, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { hidePopup } from '../../ducks/popup';
import { MAP_INTERACTION_CATEGORY } from '../../utils/analytics';

import AddItemButton from '../../AddItemButton';
import GpsFormatToggle from '../../GpsFormatToggle';

const FeatureSymbolPopup = ({ data, id }) => {
  const dispatch = useDispatch();

  const coordinates = Array.isArray(data.geometry.coordinates[0])
    ? data.geometry.coordinates[0]
    : data.geometry.coordinates;

  const onComplete = useCallback(() => dispatch(hidePopup(id)), [dispatch, id]);

  return (
    <>
      <h4>{data.properties.title || data.properties.name}</h4>
      <GpsFormatToggle
        lngLat={{ latitude: coordinates[1], longitude: coordinates[0] }}
        name="featureLayer-featureSymbolPopup-gpsFormatToggle"
      />

      <hr />

      <AddItemButton
        analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'feature popup' }}
        formProps={{ onSaveSuccess: onComplete, onSaveError: onComplete }}
        reportData={{ location: { latitude: coordinates[1], longitude: coordinates[0] } }}
        showLabel={false}
      />
    </>
  );
};

export default memo(FeatureSymbolPopup);
