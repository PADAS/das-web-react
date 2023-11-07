import React, { Fragment, memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../constants';
import { trackEvent } from '../utils/analytics';
import { validateLngLat } from '../utils/location';
import { ReactComponent as MarkerIcon } from '../common/images/icons/marker-feed.svg';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';

import styles from './styles.module.scss';

const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = ({
  clickAnalytics,
  onClick,
  coordinates,
  isMulti,
  bypassLocationValidation,
  zoom,
  iconOverride,
  className,
  dispatch: _dispatch,
  ...rest
}) => {
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();
  const buttonClass = className ? className : isMulti ? styles.multi : styles.jump;

  const isValidLocation = useMemo(() => bypassLocationValidation || (!!coordinates &&
      (Array.isArray(coordinates[0]) ?
        coordinates.every(coords => {
          if ( Array.isArray(coords[0]) ){
            const [lat, long] = coords[0];
            return validateLngLat(lat, long);
          }
          return validateLngLat(coords[0], coords[1]);
        })
        : validateLngLat(coordinates[0], coordinates[1])
      )), [bypassLocationValidation, coordinates]);

  const closeSidebarForSmallViewports = useCallback(() => {
    if (!screenIsMediumLayoutOrLarger.matches) {
      navigate('/');
    }
  }, [navigate]);

  const onJumpButtonClick = useCallback((e) => {
    const clickHandler = onClick ? e => onClick(e) : () => jumpToLocation(coordinates, zoom);
    if (clickAnalytics) {
      trackEvent(...clickAnalytics);
    }
    clickHandler(e);
    closeSidebarForSmallViewports();
  }, [clickAnalytics, closeSidebarForSmallViewports, coordinates, jumpToLocation, onClick, zoom]);

  const defaultIcon = useMemo(() => isMulti
    ? <Fragment>
      <MarkerIcon />
      <MarkerIcon />
    </Fragment>
    : <MarkerIcon />, [isMulti]);

  return isValidLocation &&
      (
      <button title="Jump to this location" type="button" className={buttonClass} onClick={onJumpButtonClick} {...rest}>
        {iconOverride ? iconOverride : defaultIcon}
      </button>
      );
};

export default memo(LocationJumpButton);

LocationJumpButton.propTypes = {
  coordinates: PropTypes.array,
  clickAnalytics: PropTypes.arrayOf(PropTypes.string),
  onClick: PropTypes.func,
  zoom: PropTypes.number,
};