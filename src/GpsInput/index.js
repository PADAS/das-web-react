import React, { memo, useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import Tooltip from 'react-bootstrap/Tooltip';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcActualGpsPositionForRawText,
  calcGpsDisplayString,
  GPS_FORMAT_EXAMPLES,
  validateLngLat,
} from '../utils/location';

import GpsFormatToggle from '../GpsFormatToggle';

import styles from './styles.module.scss';

const GpsInput = ({ buttonContent, lngLat, onButtonClick, onValidChange, tooltip, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'gpsInput' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const hasInitialLocation = !!lngLat && lngLat.length === 2;

  const [inputValue, setInputValue] = useState(hasInitialLocation
    ? calcGpsDisplayString(lngLat[1], lngLat[0], gpsFormat)
    : '');
  const [isValid, setIsValid] = useState(true);
  const [lastKnownValidValue, setLastKnownValidValue] = useState(null);

  const onInputBlur = useCallback(() => {
    if (lastKnownValidValue) {
      setInputValue(calcGpsDisplayString(lastKnownValidValue[1], lastKnownValidValue[0], gpsFormat));
    }
  }, [gpsFormat, lastKnownValidValue]);

  const onInputChange = useCallback((event) => {
    const inputValue = event.target.value;

    setInputValue(inputValue);

    if (!inputValue) {
      setIsValid(true);
      setLastKnownValidValue(inputValue);
      onValidChange(inputValue);
    } else {
      try {
        const locationObject = calcActualGpsPositionForRawText(inputValue, gpsFormat);
        const isLocationValid = validateLngLat(locationObject.longitude, locationObject.latitude);
        if (!isLocationValid) {
          setIsValid(false);
        } else {
          const valueNormalized = [
            (parseFloat(locationObject.longitude) * 10) / 10,
            (parseFloat(locationObject.latitude) * 10) / 10,
          ];

          setIsValid(true);
          setLastKnownValidValue(valueNormalized);
          onValidChange(valueNormalized);
        }
      } catch (error) {
        setIsValid(false);
      }
    }
  }, [gpsFormat, onValidChange]);

  useEffect(() => {
    if (lastKnownValidValue || hasInitialLocation) {
      const location = lastKnownValidValue || lngLat;
      setInputValue(calcGpsDisplayString(location[1], location[0], gpsFormat));
    }
  }, [gpsFormat]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <GpsFormatToggle showGpsString={false} />

    <div className={`${styles.actionsWrapper} ${onButtonClick ? styles.withButton : ''}`}>
      <OverlayTrigger
        overlay={(props) => tooltip ? <Tooltip {...props}>{tooltip}</Tooltip> : <div />}
        placement="bottom-end"
      >
        <input
          className={!isValid ? styles.error : ''}
          onBlur={onInputBlur}
          onChange={onInputChange}
          placeholder={gpsFormat ? t(`gpsFormats.${gpsFormat}`) : t('defaultPlaceholder')}
          type="text"
          value={inputValue}
          {...restProps}
        />
      </OverlayTrigger>

      {onButtonClick && <Button onClick={onButtonClick} variant="light">{buttonContent}</Button>}
    </div>

    <small className={`${styles.textBelow} ${!isValid ? styles.error : ''}`} data-testid="gpsInput-textBelow">
      {isValid
          ? t('inputExample', { gpsFormat: GPS_FORMAT_EXAMPLES[gpsFormat] })
          : t('invalidLocation')
      }
    </small>
  </>;
};

GpsInput.defaultProps = {
  buttonContent: null,
  lngLat: null,
  onButtonClick: null,
  tooltip: '',
};

GpsInput.propTypes = {
  buttonContent: PropTypes.node,
  lngLat: PropTypes.array,
  onButtonClick: PropTypes.func,
  onValidChange: PropTypes.func.isRequired,
  tooltip: PropTypes.string,
};

export default memo(GpsInput);
