import React, { forwardRef, memo, useEffect, useRef, useState } from 'react';
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

const GpsInput = ({
  gpsFormatToggleRef = null,
  id,
  inputRef = null,
  onChange,
  renderButton = null,
  value = null,
  ...otherProps
}, ref) => {
  const { t } = useTranslation('components', { keyPrefix: 'gpsInput' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const innerInputRef = useRef();

  // The input value is handled locally to accept any input, we just trigger onChange when the input value is valid.
  const [inputValue, setInputValue] = useState(value ? calcGpsDisplayString(value[1], value[0], gpsFormat) : '');
  const [isValid, setIsValid] = useState(true);

  // When blurring the input, we set the value as the input value again since it should have the last valid value.
  const onInputBlur = () => {
    setInputValue(value ? calcGpsDisplayString(value[1], value[0], gpsFormat) : '');
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
        const locationObject = calcActualGpsPositionForRawText(event.target.value, gpsFormat);
        const isLocationValid = validateLngLat(locationObject.longitude, locationObject.latitude);
        if (!isLocationValid) {
          // If the input is an invalid location in the selected GPS format, we set it as invalid.
          setIsValid(false);
        } else {
          // If the input is a valid location in the selected GPS format, we set it as valid and call onChange.
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
      // If the user changes the GPS format, we transform the input value to the new format.
      setInputValue(calcGpsDisplayString(value[1], value[0], gpsFormat));
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

export default memo(forwardRef(GpsInput));
