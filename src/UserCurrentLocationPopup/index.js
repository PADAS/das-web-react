import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';
import { Popup } from 'react-mapbox-gl';

import { hidePopup } from '../ducks/popup';

import GpsFormatToggle from '../GpsFormatToggle';

import styles from './styles.module.scss';

const UserCurrentLocationPopup = ({ data: { location }, id, hidePopup, ...rest }) => {
  const { coords, timestamp } = location;
  const coordinates = [coords.longitude, coords.latitude];
  const lastRead = new Date(timestamp);

  return <Popup className={styles.popup} anchor='bottom' offset={[0, -6]} coordinates={coordinates} id='dropped-marker-popup' {...rest}>
    <h6>Your current location:</h6>
    <GpsFormatToggle lng={coords.longitude} lat={coords.latitude} />
    <p>Accurate to within {coords.accuracy} meters</p>
    <p>Last checked <TimeAgo date={lastRead} /></p>
  </Popup>;
};

UserCurrentLocationPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default connect(null, { hidePopup })(memo(UserCurrentLocationPopup));