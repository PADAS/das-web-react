import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MarkerIcon } from '../common/images/icons/marker-feed.svg';

import { BREAKPOINTS } from '../constants';
import { trackEvent } from '../utils/analytics';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';
import { validateLngLat } from '../utils/location';

import styles from './styles.module.scss';

const LocationJumpButton = ({
  bypassLocationValidation,
  className,
  clickAnalytics,
  coordinates,
  isMulti,
  onClick,
  zoom,
  ...restProps
}) => {
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'locationJumpButton' });

  const buttonClass = className ? className : isMulti ? styles.multi : styles.jump;

  const isValidLocation = useMemo(() => {
    if (bypassLocationValidation) {
      return true;
    }

    if (!!coordinates) {
      if (Array.isArray(coordinates[0])) {
        return coordinates.every((coords) => {
          if (Array.isArray(coords[0])) {
            return validateLngLat(coords[0][0], coords[0][1]);
          }
          return validateLngLat(coords[0], coords[1]);
        });
      } else {
        return validateLngLat(coordinates[0], coordinates[1]);
      }
    }

    return false;
  }, [bypassLocationValidation, coordinates]);

  const onJumpButtonClick = useCallback((event) => {
    if (clickAnalytics) {
      trackEvent(...clickAnalytics);
    }

    if (onClick) {
      onClick(event);
    } else {
      jumpToLocation(coordinates, zoom);
    }

    if (!BREAKPOINTS.screenIsMediumLayoutOrLarger.matches) {
      navigate('/');
    }
  }, [clickAnalytics, coordinates, jumpToLocation, navigate, onClick, zoom]);

  const icon = isMulti
    ? <>
      <MarkerIcon />
      <MarkerIcon />
    </>
    : <MarkerIcon />;

  return isValidLocation && <button
    className={buttonClass}
    onClick={onJumpButtonClick}
    title={t('title')}
    type="button"
    {...restProps}
  >
    {icon}
  </button>;
};

LocationJumpButton.defaultProps = {
  bypassLocationValidation: false,
  className: '',
  clickAnalytics: null,
  coordinates: null,
  isMulti: false,
  onClick: null,
  zoom: 14,
};

LocationJumpButton.propTypes = {
  bypassLocationValidation: PropTypes.bool,
  className: PropTypes.string,
  clickAnalytics: PropTypes.arrayOf(PropTypes.string),
  coordinates: PropTypes.array,
  isMulti: PropTypes.bool,
  onClick: PropTypes.func,
  zoom: PropTypes.number,
};

export default memo(LocationJumpButton);
