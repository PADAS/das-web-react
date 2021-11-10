import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { updateUserPreferences } from '../ducks/user-preferences';
import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';
import { trackEventFactory, GPS_FORMAT_CATEGORY } from '../utils/analytics';

import TextCopyBtn from '../TextCopyBtn';

import styles from './styles.module.scss';

const gpsFormats = Object.values(GPS_FORMATS);
const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const GpsFormatToggle = (props) => {
  const { updateUserPreferences, showGpsString = true, showCopyControl = showGpsString, lat, lng, currentFormat, className, ...rest } = props;

  const onGpsFormatClick = (gpsFormat) => {
    gpsFormatTracker.track('Change GPS Format', `GPS Format:${gpsFormat}`);
    updateUserPreferences({
      gpsFormat,
    });
  };

  const gpsString = showGpsString && calcGpsDisplayString(lat, lng, currentFormat);
  const displayGpsString = gpsString || null;

  return (
    <div className={`${styles.container} ${className}`} {...rest}>
      <ul className={styles.choices}>
        {gpsFormats.map(gpsFormat =>
          <li key={gpsFormat} className={gpsFormat === currentFormat ? styles.active : ''}
            onClick={() => onGpsFormatClick(gpsFormat)}>{gpsFormat}</li>
        )}
      </ul>
      {displayGpsString && <div className={styles.gpsStringWrapper}>
        <span className={styles.value}>{displayGpsString}</span>
        {showCopyControl && <TextCopyBtn text={displayGpsString} />}
      </div>
      }
    </div>
  );
};


GpsFormatToggle.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentFormat: PropTypes.string.isRequired,
  showGpsString: PropTypes.bool,
};

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }) => ({ currentFormat: gpsFormat });

export default connect(mapStateToProps, { updateUserPreferences })(memo(GpsFormatToggle));