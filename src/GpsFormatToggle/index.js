import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';
import { GPS_FORMAT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { updateUserPreferences } from '../ducks/user-preferences';

import TextCopyBtn from '../TextCopyBtn';

import styles from './styles.module.scss';

const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const GpsFormatChoice = ({ currentFormat, format }) => {
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    dispatch(updateUserPreferences({ gpsFormat: format }));

    gpsFormatTracker.track('Change GPS Format', `GPS Format:${format}`);
  }, [dispatch, format]);

  return <li className={format === currentFormat ? styles.active : ''} onClick={onClick}>
    {format}
  </li>;
};

const GpsFormatToggle = ({ lat, lng, showGpsString, showCopyControl, ...rest }) => {
  const currentGPSFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const gpsString = showGpsString ? calcGpsDisplayString(lat, lng, currentGPSFormat) : null;
  const shouldShowCopyControl = showCopyControl ?? showGpsString;

  return <div {...rest}>
    <ul className={styles.choices}>
      {Object.values(GPS_FORMATS).map((gpsFormat) => <GpsFormatChoice
        currentFormat={currentGPSFormat}
        format={gpsFormat}
        key={gpsFormat}
      />)}
    </ul>

    {gpsString && <div className={styles.gpsStringWrapper}>
      <span className={styles.value} data-testid="gpsFormatToggle-gpsString">{gpsString}</span>

      {shouldShowCopyControl && <TextCopyBtn text={gpsString} />}
    </div>}
  </div>;
};

GpsFormatToggle.defaultProps = {
  lat: null,
  lng: null,
  showCopyControl: null,
  showGpsString: true,
};

GpsFormatToggle.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showCopyControl: PropTypes.bool,
  showGpsString: PropTypes.bool,
};

export default memo(GpsFormatToggle);