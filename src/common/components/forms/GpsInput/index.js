import React, { Fragment, memo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';
import Alert from 'react-bootstrap/Alert';

import { calcActualGpsPositionForRawText, calcGpsDisplayString, validateLngLat, GPS_FORMAT_LABELS, GPS_FORMAT_EXAMPLES } from '../../../../utils/location';
import GpsFormatToggle from '../../../../user/preferences/GpsFormatToggle';

import styles from './styles.module.scss';

const gpsPositionObjectContainsValidValues = locationObject => validateLngLat(locationObject.longitude, locationObject.latitude);

const GpsInput = (props) => {
  const { gpsFormat, inputProps, lngLat: originalLngLat, onValidChange, showFormatToggle, dispatch: _dispatch, ...rest } = props;

  const lngLat = originalLngLat ? [...originalLngLat] : null;
  const hasLocation = !!lngLat && lngLat.length === 2;
  const placeholder = GPS_FORMAT_LABELS[gpsFormat] || 'Location';

  const [lastKnownValidValue, setLastKnownValidValue] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [valid, setValidationState] = useState(true);
  const [initialized, setInitState] = useState(false);

  const handleValidationError = (e) => {
    setValidationState(false);
  };

  const onInputChange = useCallback(({ target: { value } }) => {
    setInputValue(value);
  }, []);


  const setUpStateWithLocationProp = () => {
    setInputValue(hasLocation
      ? calcGpsDisplayString(lngLat[1], lngLat[0], gpsFormat)
      : '');
  };

  const onFormatPropUpdate = () => {
    if (hasLocation) {
      const location = lastKnownValidValue || lngLat;

      setInputValue(calcGpsDisplayString(location[1], location[0], gpsFormat));
    }
  };

  const onValueUpdate = () => {
    if (!inputValue || !lastKnownValidValue) {
      validateNewInputValue();
    } else try {
      validateNewInputValue();
    } catch (e) {
      handleValidationError(e);
    }
  };

  const onInputBlur = useCallback(() => {
    if (lastKnownValidValue) {
      setInputValue(calcGpsDisplayString(lastKnownValidValue[1], lastKnownValidValue[0], gpsFormat));
    }
  }, [gpsFormat, lastKnownValidValue]);

  const validateNewInputValue = () => {
    if (!inputValue) {
      setValidationState(true);
      setLastKnownValidValue(inputValue);
    } else try {
      const locationObject = calcActualGpsPositionForRawText(inputValue, gpsFormat);
      const value = [(parseFloat(locationObject.longitude) * 10) / 10, (parseFloat(locationObject.latitude) * 10) / 10];

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
    if (!initialized) {
      setInitState(true);
    } else {
      onValidChange(lastKnownValidValue);
    }
  };

  useEffect(setUpStateWithLocationProp, []);
  useEffect(onFormatPropUpdate, [gpsFormat]);
  useEffect(onValueUpdate, [inputValue]);
  useEffect(handleValidChange, [lastKnownValidValue]);

  return <div className={styles.wrapper}>
    {showFormatToggle &&
      <Fragment>
        <GpsFormatToggle showGpsString={false} lng={hasLocation ? parseFloat(lngLat[0]) : 0} lat={hasLocation ? parseFloat(lngLat[1]) : 0} />
        <small>Example: {GPS_FORMAT_EXAMPLES[gpsFormat]}</small>
      </Fragment>
    }
    <input className={valid ? '' : styles.errorInput} {...inputProps} placeholder={placeholder}
      type='text' value={inputValue} onBlur={onInputBlur} onChange={onInputChange} {...rest} />
    {!valid && <Alert className={styles.errorMessage} variant='danger'>Invalid location</Alert>}
  </div>;
};

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }) => ({ gpsFormat });

export default connect(mapStateToProps, null)(memo(GpsInput, (prev, next) =>
  isEqual(prev.gpsFormat && next.gpsFormat) && isEqual(prev.lngLat, next.lngLat)));

GpsInput.defaultProps = {
  onValidChange(value) {
  },
  inputProps: {},
  showFormatToggle: true,
};

GpsInput.propTypes = {
  lngLat: PropTypes.array,
  showFormatToggle: PropTypes.bool,
  inputProps: PropTypes.object,
  onValidChange: PropTypes.func,
};
