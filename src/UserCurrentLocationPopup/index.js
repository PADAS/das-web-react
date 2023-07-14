import React, { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';
import PropTypes from 'prop-types';
import TimeAgo from '../TimeAgo';
import { useDispatch } from 'react-redux';

import { hidePopup } from '../ducks/popup';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddItemButton from '../AddItemButton';
import GpsFormatToggle from '../GpsFormatToggle';

const UserCurrentLocationPopup = ({ data: { location }, id }) => {
  const dispatch = useDispatch();

  const { coords, timestamp } = location;
  const lastRead = new Date(timestamp);

  const onComplete = useCallback(() => dispatch(hidePopup(id)), [dispatch, id]);

  return <>
    <h4>Your current location:</h4>
    <GpsFormatToggle lng={coords.longitude} lat={coords.latitude} />
    <p>Accurate to within {coords.accuracy} meters</p>
    <p>Last checked <TimeAgo date={lastRead} /></p>
    <hr />
    <AddItemButton
      analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'current user location' }}
      formProps={{ onSaveSuccess: onComplete, onSaveError: onComplete }}
      reportData={{
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
      }}
      showLabel={false}
    />
  </>;
};

UserCurrentLocationPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

const compareFunction = (
  { data: { location: oldLocation } },
  { data: { location: newLocation } }
) => isEqual(oldLocation, newLocation);

export default memo(UserCurrentLocationPopup, compareFunction);