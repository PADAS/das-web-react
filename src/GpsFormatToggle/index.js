import React, { useCallback, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Alert from 'react-bootstrap/Alert';

import { updateUserPreferences } from '../ducks/user-preferences';
import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';
import { trackEvent } from '../utils/analytics';

import { ReactComponent as ClipboardIcon } from '../common/images/icons/clipboard-icon.svg';

import styles from './styles.module.scss';

const gpsFormats = Object.values(GPS_FORMATS);

const GpsFormatToggle = (props) => {
  const { updateUserPreferences, showGpsString = true, showCopyControl = showGpsString, lat, lng, currentFormat, className, ...rest } = props;

  const [copySuccess, showCopySuccess] = useState(false);
  const copySuccessMsgAlertTimeout = useRef(null);

  const onGpsFormatClick = (gpsFormat) => {
    trackEvent('GPS Format', 'Change GPS Format', `GPS Format:${gpsFormat}`);
    updateUserPreferences({
      gpsFormat,
    });
    showCopySuccess(false);
  };

  const gpsString = showGpsString && calcGpsDisplayString(lat, lng, currentFormat) ? calcGpsDisplayString(lat, lng, currentFormat) : null;

  const onCopySuccess = useCallback(() => {
    clearTimeout(copySuccessMsgAlertTimeout.current);
    showCopySuccess(true);

    copySuccessMsgAlertTimeout.current = setTimeout(() => {
      showCopySuccess(false);
    }, [2500]);
  }, []);

  const onClickCopy = useCallback(async () => {
    showCopySuccess(false);
    
    await navigator.clipboard.writeText(gpsString)
      .catch((error) => {
        console.warn('error copying value to clipboard', error);
      });

    onCopySuccess();
  }, [gpsString, onCopySuccess]);



  return (
    <div className={`${styles.container} ${className}`} {...rest}>
      <ul className={styles.choices}>
        {gpsFormats.map(gpsFormat =>
          <li key={gpsFormat} className={gpsFormat === currentFormat ? styles.active : ''} 
            onClick={() => onGpsFormatClick(gpsFormat)}>{gpsFormat}</li>
        )}
      </ul> 
      {showGpsString && <div className={styles.gpsStringWrapper}>
        <span className={styles.value}>{gpsString}</span>
        {showCopyControl && <ClipboardIcon onClick={onClickCopy} />}
        {copySuccess && <Alert className={styles.copySuccessMsg} variant='success'>Copied to clipboard</Alert>}
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