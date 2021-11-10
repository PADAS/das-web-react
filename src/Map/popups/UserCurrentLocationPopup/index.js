import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';

import AR from '../../../events/forms/AddEvent';
import TimeAgo from '../../../common/components/date/TimeAgo';
import GpsFormatToggle from '../../../user/preferences/GpsFormatToggle';

import { hidePopup } from '../../../ducks/popup';
import { withMap } from '../../EarthRangerMap';


const AddEvent = withMap(AR);

const UserCurrentLocationPopup = ({ data: { location }, id, hidePopup, popoverPlacement }) => {
  const { coords, timestamp } = location;
  const lastRead = new Date(timestamp);

  const onComplete = () => {
    hidePopup(id);
  };

  return <>
    <h4>Your current location:</h4>
    <GpsFormatToggle lng={coords.longitude} lat={coords.latitude} />
    <p>Accurate to within {coords.accuracy} meters</p>
    <p>Last checked <TimeAgo date={lastRead} /></p>
    <hr />
    <AddEvent
      analyticsMetadata={{
        category: 'Map Interaction',
        location: 'current user location',
      }} reportData={{
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
      }}
      showLabel={false}
      formProps={{
        onSaveSuccess: onComplete,
        onSaveError: onComplete,
      }}
      popoverPlacement={popoverPlacement}
    />
  </>;
};

UserCurrentLocationPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

const compareFunction = ({ data: { location: oldLocation } }, { data: { location: newLocation } }) => isEqual(oldLocation, newLocation);

export default connect(null, { hidePopup })(memo(UserCurrentLocationPopup, compareFunction));