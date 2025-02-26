import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
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

const GpsInput = ({ gpsFormatToggleRef, id, onChange, renderButton = null, value = null, ...otherProps }, ref) => {
  const { t } = useTranslation('components', { keyPrefix: 'gpsInput' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const innerRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const [inputValue, setInputValue] = useState(!!value && value.length === 2
    ? calcGpsDisplayString(value[1], value[0], gpsFormat)
    : '');
  const [isValid, setIsValid] = useState(true);

  const onInputBlur = () => {
    setInputValue(value ? calcGpsDisplayString(value[1], value[0], gpsFormat) : '');
    setIsValid(true);
  };

  const onInputChange = (event) => {
    setInputValue(event.target.value);

    if (!event.target.value) {
      setIsValid(true);
      onChange(null);
    } else {
      try {
        const locationObject = calcActualGpsPositionForRawText(event.target.value, gpsFormat);
        const isLocationValid = validateLngLat(locationObject.longitude, locationObject.latitude);
        if (!isLocationValid) {
          setIsValid(false);
        } else {
          setIsValid(true);
          onChange([
            (parseFloat(locationObject.longitude) * 10) / 10,
            (parseFloat(locationObject.latitude) * 10) / 10,
          ]);
        }
      } catch (error) {
        setIsValid(false);
      }
    }
  };

  useEffect(() => {
    if (value) {
      setInputValue(calcGpsDisplayString(value[1], value[0], gpsFormat));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsFormat]);

  return <div role="group">
    <GpsFormatToggle
      onKeyDown={(event) => event.key === 'Enter' && innerRef.current.focus()}
      showGpsString={false}
      ref={gpsFormatToggleRef}
    />

    <div className={styles.inputWrapper}>
      <input
        aria-describedby={`${id}-description`}
        aria-errormessage={!isValid ? `${id}-description` : undefined}
        aria-invalid={!isValid}
        aria-label={t('inputLabel')}
        className={`${styles.input} ${renderButton ? styles.hasButton : ''}`}
        id={id}
        onBlur={onInputBlur}
        onChange={onInputChange}
        placeholder={gpsFormat ? t(`placeholders.${gpsFormat}`) : t('defaultPlaceholder')}
        ref={innerRef}
        type="text"
        value={inputValue}
        {...otherProps}
      />

      {renderButton?.()}
    </div>

    <p
      aria-live={isValid ? 'off' : 'assertive'}
      className={`${styles.description} ${!isValid ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {isValid
        ? t('inputDescription', { gpsFormat: GPS_FORMAT_EXAMPLES[gpsFormat] })
        : t('errorMessage')}
    </p>
  </div>;
};

export default memo(forwardRef(GpsInput));
