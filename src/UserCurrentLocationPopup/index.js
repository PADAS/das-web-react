import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TimeAgo from '../TimeAgo';
import isEqual from 'react-fast-compare';

import AR from '../AddReport';

import { hidePopup } from '../ducks/popup';
import { withMap } from '../EarthRangerMap';

import GpsFormatToggle from '../GpsFormatToggle';

const AddReport = withMap(AR);

const UserCurrentLocationPopup = ({ data: { location }, id, hidePopup, ...rest }) => {
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
    <AddReport  analyticsMetadata={{
      category: 'Map Interaction',
      location: 'current user location',
    }} reportData={{
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
    }}
    formProps={{
      onSaveSuccess: onComplete,
      onSaveError: onComplete,
    }}
    />
  </>;
};

UserCurrentLocationPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

const compareFunction = ({ data: { location:oldLocation } }, { data: { location:newLocation } }) => isEqual(oldLocation, newLocation);

export default connect(null, { hidePopup })(memo(UserCurrentLocationPopup, compareFunction));