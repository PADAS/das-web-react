import React, { Fragment, memo, useContext } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { MapContext } from '../App';
import { BREAKPOINTS, DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import { jumpToLocation } from '../utils/map';
import { trackEvent } from '../utils/analytics';
import { validateLngLat } from '../utils/location';
import { ReactComponent as MarkerIcon } from '../common/images/icons/marker-feed.svg';

import { updateUserPreferences } from '../ducks/user-preferences';

import styles from './styles.module.scss';

const { ENABLE_URL_NAVIGATION } = DEVELOPMENT_FEATURE_FLAGS;

const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = ({ clickAnalytics, onClick, coordinates, isMulti, bypassLocationValidation,
  zoom, updateUserPreferences, iconOverride, className, dispatch: _dispatch, ...rest }) => {
  const navigate = useNavigate();

  const buttonClass = className ? className : isMulti ? styles.multi : styles.jump;
  const map = useContext(MapContext);

  const isValidLocation = bypassLocationValidation || (!!coordinates &&
    (Array.isArray(coordinates[0]) ?
      coordinates.every(coords => validateLngLat(coords[0], coords[1]))
      : validateLngLat(coordinates[0], coordinates[1])
    ));

  const closeSidebarForSmallViewports = () => {
    if (!screenIsMediumLayoutOrLarger.matches) {
      if (ENABLE_URL_NAVIGATION) navigate('/');
      else updateUserPreferences({ sidebarOpen: false });
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

  const defaultIcon = isMulti?
    <Fragment><MarkerIcon /><MarkerIcon /></Fragment> : <MarkerIcon />;

  return isValidLocation && <button title="Jump to this location" type="button"
    className={buttonClass} onClick={onJumpButtonClick} {...rest}>
    {iconOverride ? iconOverride : defaultIcon}
  </button>;
};

export default connect(null, { updateUserPreferences })(memo(LocationJumpButton));

LocationJumpButton.propTypes = {
  coordinates: PropTypes.array,
  clickAnalytics: PropTypes.arrayOf(PropTypes.string),
  onClick: PropTypes.func,
  zoom: PropTypes.number,
};