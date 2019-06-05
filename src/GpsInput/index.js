import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';

import { calcActualGpsPositionForRawText, calcGpsDisplayString, validateLngLat } from '../utils/location';

import GpsFormatToggle from '../GpsFormatToggle';

import styles from './styles.module.scss';

const gpsPositionObjectContainsValidValues = locationObject => validateLngLat(locationObject.latitude, locationObject.longitude);

const GpsInput = memo((props) => {
  const { lngLat: originalLngLat, gpsFormat, onValidChange } = props;
  const lngLat = [...originalLngLat];
  const hasLocation = !!lngLat && lngLat.length === 2;

  const [lastKnownValidValue, setLastKnownValidValue] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [valid, setValidationState] = useState(true);

  const handleValidationError = (e) => {
    console.log('error with GPS input', e);
    setValidationState(false);
  }; 

  const onInputChange = ({ target: { value } }) => {
    setInputValue(value);
  };


  const setUpStateWithLocationProp = () => {
    if (hasLocation) {
      setInputValue(calcGpsDisplayString(lngLat[1], lngLat[0], gpsFormat));
    } else {
      setInputValue('');
    }
  };

  const onFormatPropUpdate = () => {
    if (hasLocation) {
      const location = lastKnownValidValue || lngLat;

      setInputValue(calcGpsDisplayString(location[1], location[0], gpsFormat));
    }
  };

  const onValueUpdate = () => {
    if (!inputValue) setValidationState(true);
    else if (!lastKnownValidValue) validateNewInputValue();
    else try {
      const value = calcActualGpsPositionForRawText(inputValue, gpsFormat);
      validateNewInputValue();
    } catch (e) {
      handleValidationError(e);
    }
  };

  const onInputBlur = () => {
    if (lastKnownValidValue) {
      setInputValue(calcGpsDisplayString(lastKnownValidValue[1], lastKnownValidValue[0], gpsFormat));
    }
  };

  const validateNewInputValue = () => {
    try {
      const locationObject = calcActualGpsPositionForRawText(inputValue, gpsFormat);
      const value = [parseFloat(locationObject.longitude), parseFloat(locationObject.latitude)];

      if (!gpsPositionObjectContainsValidValues(locationObject)) {
        handleValidationError(new Error('invalid location object'));
      } else {
        setValidationState(true);
        setLastKnownValidValue(value);
      }
    } catch (e) {
      handleValidationError(e);
    }
  };

  const handleValidChange = () => {
    onValidChange(lastKnownValidValue);
  };

  const resetInput = () => {
    setUpStateWithLocationProp();
  };

  useEffect(setUpStateWithLocationProp, []);
  useEffect(onFormatPropUpdate, [gpsFormat]);
  useEffect(onValueUpdate, [inputValue]);
  useEffect(handleValidChange, [lastKnownValidValue]);

  return <div className={styles.wrapper}>
    <GpsFormatToggle lng={hasLocation ? lngLat[0] : 0} lat={hasLocation ? lngLat[1] : 0} />
    <input type="text" value={inputValue} onBlur={onInputBlur} onChange={onInputChange} />
    {!valid && 'invalid location'}
  </div>;
}, (prev, next) => isEqual(prev.gpsFormat && next.gpsFormat) && isEqual(prev.lngLat, next.lngLat));

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }) => ({ gpsFormat });

export default connect(mapStateToProps, null)(GpsInput);

GpsInput.defaultProps = {
  onValidChange(value) {
    console.log('i am validated', value);
  },
};

GpsInput.propTypes = {
  lngLat: PropTypes.array,
};