import React, { memo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { hidePopup } from '../ducks/popup';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddButton from '../AddButton';
import GpsFormatToggle from '../GpsFormatToggle';

const DroppedMarkerPopup = ({ data: { location }, id }) => {
  const dispatch = useDispatch();

  const containerRef = useRef(null);

  const onComplete = useCallback(() => dispatch(hidePopup(id)), [dispatch, id]);

  return <>
    <GpsFormatToggle lng={location.lng} lat={location.lat} />

    <hr ref={containerRef} />

    <AddButton
      analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'dropped marker on map' }}
      formProps={{ onSaveSuccess: onComplete, onSaveError: onComplete }}
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
