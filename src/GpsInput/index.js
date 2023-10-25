import React, { memo, useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import Tooltip from 'react-bootstrap/Tooltip';
import { useSelector } from 'react-redux';

import {
  calcActualGpsPositionForRawText,
  calcGpsDisplayString,
  GPS_FORMAT_EXAMPLES,
  GPS_FORMAT_LABELS,
  validateLngLat,
} from '../utils/location';

import GpsFormatToggle from '../GpsFormatToggle';

import styles from './styles.module.scss';

const GpsInput = ({ buttonContent, lngLat, onButtonClick, onValidChange, tooltip, ...rest }) => {
  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const hasLocation = !!lngLat && lngLat.length === 2;

  const [inputValue, setInputValue] = useState(hasLocation
    ? calcGpsDisplayString(lngLat[1], lngLat[0], gpsFormat)
    : '');
  const [isValid, setIsValid] = useState(true);
  const [lastKnownValidValue, setLastKnownValidValue] = useState(null);

  const onInputBlur = useCallback(() => {
    if (lastKnownValidValue) {
      setInputValue(calcGpsDisplayString(lastKnownValidValue[1], lastKnownValidValue[0], gpsFormat));
    }
  }, [gpsFormat, lastKnownValidValue]);

  const onInputChange = useCallback((event) => setInputValue(event.target.value), []);

  const onValueValidated = useCallback((value) => {
    setIsValid(true);
    setLastKnownValidValue(value);
    onValidChange(value);
  }, [onValidChange]);

  useEffect(() => {
    if (lastKnownValidValue || hasLocation) {
      const location = lastKnownValidValue || lngLat;
      setInputValue(calcGpsDisplayString(location[1], location[0], gpsFormat));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsFormat]);

  useEffect(() => {
    if (!inputValue) {
      onValueValidated(inputValue);
    } else {
      try {
        const locationObject = calcActualGpsPositionForRawText(inputValue, gpsFormat);
        const isLocationValid = validateLngLat(locationObject.longitude, locationObject.latitude);
        if (!isLocationValid) {
          setIsValid(false);
        } else {
          onValueValidated([
            (parseFloat(locationObject.longitude) * 10) / 10,
            (parseFloat(locationObject.latitude) * 10) / 10,
          ]);
        }
      } catch (error) {
        setIsValid(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, onValueValidated]);

  return <>
    <GpsFormatToggle showGpsString={false} />

    <div className={`${styles.actionsWrapper} ${onButtonClick ? styles.withButton : ''}`}>
      <OverlayTrigger
        placement="bottom-end"
        overlay={(props) => tooltip ? <Tooltip {...props}>{tooltip}</Tooltip> : <div />}
      >
        <input
          className={!isValid ? styles.error : ''}
          onBlur={onInputBlur}
          onChange={onInputChange}
          placeholder={GPS_FORMAT_LABELS[gpsFormat] || 'Location'}
          type="text"
          value={inputValue}
          {...rest}
        />
      </OverlayTrigger>

      {onButtonClick && <Button onClick={onButtonClick} variant="light">
        {buttonContent}
      </Button>}
    </div>

    <small className={`${styles.textBelow} ${!isValid ? styles.error : ''}`}>
      {isValid ? `Example: ${GPS_FORMAT_EXAMPLES[gpsFormat]}` : 'Invalid location'}
    </small>
  </>;
};

GpsInput.defaultProps = {
  buttonContent: null,
  lngLat: null,
  onButtonClick: null,
  onValidChange: null,
  tooltip: '',
};

GpsInput.propTypes = {
  buttonContent: PropTypes.node,
  lngLat: PropTypes.array,
  onButtonClick: PropTypes.func,
  onValidChange: PropTypes.func,
  tooltip: PropTypes.string,
};

export default memo(GpsInput);
