import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { updateUserPreferences } from '../ducks/user-preferences';
import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';
import styles from './styles.module.scss';

const gpsFormats = Object.values(GPS_FORMATS);

const GpsFormatToggle = memo((props) => {
  const { updateUserPreferences, lat, lng, currentFormat, ...rest } = props;

  return (
    <div className={styles.container} {...rest}>
      <ul className={styles.choices}>
        {gpsFormats.map(gpsFormat =>
          <li key={gpsFormat} className={gpsFormat === currentFormat ? styles.active : ''} onClick={() => updateUserPreferences({
            gpsFormat,
          })}>{gpsFormat}</li>
        )}
      </ul>
      <span className={styles.value}>{calcGpsDisplayString(lng, lat, currentFormat)}</span>
    </div>
  );
});


GpsFormatToggle.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentFormat: PropTypes.string.isRequired,
};

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }) => ({ currentFormat: gpsFormat })

export default connect(mapStateToProps, { updateUserPreferences })(GpsFormatToggle);