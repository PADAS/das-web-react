import React, { Fragment, memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../../constants';
import { jumpToLocation } from '../../../utils/map';
import { trackEvent } from '../../../utils/analytics';
import { validateLngLat } from '../../../utils/location';
import { ReactComponent as MarkerIcon } from '../../../common/images/icons/marker-feed.svg';

import { updateUserPreferences } from '../../../ducks/user-preferences';

import styles from './styles.module.scss';

const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = (props) => {
  const { clickAnalytics, onBounceClick, onClick, map, coordinates, isMulti, bypassLocationValidation,
    zoom, updateUserPreferences, iconOverride, className, setBounceEventIDs, dispatch: _dispatch, ...rest } = props;

  const buttonClass = className ? className : isMulti ? styles.multi : styles.jump;

  const isValidLocation = bypassLocationValidation || (!!coordinates &&
    (Array.isArray(coordinates[0]) ?
      coordinates.every(coords => validateLngLat(coords[0], coords[1]))
      : validateLngLat(coordinates[0], coordinates[1])
    ));

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
  map: PropTypes.object,
  zoom: PropTypes.number,
};