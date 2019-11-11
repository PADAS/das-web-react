import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../constants';
import { updateUserPreferences } from '../ducks/user-preferences';
import { jumpToLocation } from '../utils/map';
import { trackEvent } from '../utils/analytics';
import { validateLngLat } from '../utils/location';
import { ReactComponent as MarkerIcon } from '../common/images/icons/marker-feed.svg';

import styles from './styles.module.scss';


const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = (props) => {
  const { clickAnalytics, onClick, map, coordinates, isMulti, isFeature, zoom, updateUserPreferences, onButtonClick, ...rest } = props;

  const isValidLocation = (!!coordinates &&
    (Array.isArray(coordinates[0]) ?
      coordinates.every(coords => validateLngLat(coords[0], coords[1]))
      : validateLngLat(coordinates[0], coordinates[1])
    )) || isFeature;

  const closeSidebarForSmallViewports = () => {
    if (!screenIsMediumLayoutOrLarger.matches) {
      updateUserPreferences({ sidebarOpen: false });
    }
  };

  const onJumpButtonClick = (e) => {
    const clickHandler = onClick ? e => onClick(e) : () => jumpToLocation(map, coordinates, zoom);
    if (clickAnalytics) {
      trackEvent(...clickAnalytics);
    }
    clickHandler(e);
    closeSidebarForSmallViewports();
  };

  return isValidLocation && <button title="Jump to this location" type="button"
    className={isMulti ? styles.multi : styles.jump} onClick={onJumpButtonClick} {...rest}>
    <MarkerIcon />
    {isMulti && <MarkerIcon />}
  </button>;
};

export default connect(null, { updateUserPreferences })(memo(LocationJumpButton));


LocationJumpButton.propTypes = {
  coordinates: PropTypes.array,
  clickAnalytics: PropTypes.arrayOf(PropTypes.string),
  onClick: PropTypes.func,
  map: PropTypes.object,
  zoom: PropTypes.number,
};