import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TimeAgo from '../TimeAgo';
import { Popup } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

import AR from '../AddReport';

import { hidePopup } from '../ducks/popup';
import { withMap } from '../EarthRangerMap';

import GpsFormatToggle from '../GpsFormatToggle';

import styles from './styles.module.scss';
const AddReport = withMap(AR);

const UserCurrentLocationPopup = ({ data: { location }, id, hidePopup, ...rest }) => {
  const { coords, timestamp } = location;
  const coordinates = [coords.longitude, coords.latitude];
  const lastRead = new Date(timestamp);

  const onComplete = () => {
    hidePopup(id);
  };

  return <Popup className={styles.popup} anchor='bottom' offset={[0, -6]} coordinates={coordinates} id='dropped-marker-popup' {...rest}>
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
  </Popup>;
};

UserCurrentLocationPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

const compareFunction = ({ data: { location:oldLocation } }, { data: { location:newLocation } }) => isEqual(oldLocation, newLocation);

export default connect(null, { hidePopup })(memo(UserCurrentLocationPopup, compareFunction));