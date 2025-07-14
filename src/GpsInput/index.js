import React, { memo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcGpsDisplayString,
  GPS_FORMAT_EXAMPLES,
  normalizeGpsFormatTextToLngLat,
  validateLngLat,
} from '../utils/location';

import GpsFormatToggle from '../GpsFormatToggle';

import * as styles from './styles.module.scss';

const GpsInput = ({
  gpsFormatToggleRef = null,
  id,
  inputRef = null,
  onChange,
  ref,
  renderButton = null,
  value = null,
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'gpsInput' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const innerInputRef = useRef();

  // The input value is handled locally to accept any input, we just trigger onChange when the input value is valid.
  const [inputValue, setInputValue] = useState(value
    ? calcGpsDisplayString(value.latitude, value.longitude, gpsFormat)
    : '');
  const [isValid, setIsValid] = useState(true);

  // When blurring the input, we set the value as the input value again since it should have the last valid value.
  const onInputBlur = () => {
    setInputValue(value ? calcGpsDisplayString(value.latitude, value.longitude, gpsFormat) : '');
    setIsValid(true);
  };

  const onInputChange = (event) => {
    setInputValue(event.target.value);

    if (!event.target.value) {
      // If the input was emptied, it is valid.
      setIsValid(true);
      onChange(null);
    } else {
      try {
        const lngLat = normalizeGpsFormatTextToLngLat(event.target.value, gpsFormat);
        const isLocationValid = validateLngLat(lngLat.longitude, lngLat.latitude);

        setIsValid(isLocationValid);

        if (isLocationValid) {
          // Call onChange for valid locations.
          onChange({
            latitude: (parseFloat(lngLat.latitude) * 10) / 10,
            longitude: (parseFloat(lngLat.longitude) * 10) / 10,
          });
        }
      } catch (error) {
        setIsValid(false);
      }
    }
  };

  useEffect(() => {
    if (value) {
      // If the user changes the GPS format, we transform the input value to the new format.
      setInputValue(calcGpsDisplayString(value.latitude, value.longitude, gpsFormat));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsFormat]);

  return <div ref={ref} role="group" {...otherProps}>
    <GpsFormatToggle
      name={`${id}-gpsFormatToggle`}
      onKeyDown={(event) => event.key === 'Enter' && innerInputRef.current.focus()}
      ref={gpsFormatToggleRef}
      showGpsString={false}
    />

    <div className={styles.inputWrapper}>
      <input
        aria-describedby={`${id}-description`}
        aria-errormessage={!isValid ? `${id}-description` : undefined}
        aria-invalid={!isValid}
        aria-label={t('inputLabel')}
        className={styles.input}
        id={id}
        onBlur={onInputBlur}
        onChange={onInputChange}
        placeholder={gpsFormat ? t(`placeholders.${gpsFormat}`) : t('defaultPlaceholder')}
        ref={(element) => {
          if (inputRef) {
            inputRef.current = element;
          }
          innerInputRef.current = element;
        }}
        type="text"
        value={inputValue}
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

export default memo(GpsInput);
