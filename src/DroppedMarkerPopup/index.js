import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { hidePopup } from '../ducks/popup';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddItemButton from '../AddItemButton';
import GpsFormatToggle from '../GpsFormatToggle';

const DroppedMarkerPopup = ({ data: { location }, id }) => {
  const dispatch = useDispatch();

  const onComplete = useCallback(() => dispatch(hidePopup(id)), [dispatch, id]);

  return <>
    <GpsFormatToggle lat={location.lat} lng={location.lng} />

    <hr />

    <AddItemButton
      analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'dropped marker on map' }}
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

DroppedMarkerPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default memo(DroppedMarkerPopup);
