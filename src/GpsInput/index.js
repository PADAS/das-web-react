import React, { memo, useEffect, useId, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  GPS_FORMAT_EXAMPLES,
  normalizeLocationTextToLngLat,
  transformLngLatToLocationType,
  validateLngLat,
} from '../utils/location';

import GpsFormatToggle from '../GpsFormatToggle';

import * as styles from './styles.module.scss';

const GpsInput = ({
  gpsFormatToggleRef = null,
  id = null,
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

  const descriptionId = useId();

  // The input value is handled locally to accept any input, we just trigger onChange when the input value is valid.
  const [inputValue, setInputValue] = useState(value
    ? transformLngLatToLocationType(value, gpsFormat)
    : '');
  const [isValid, setIsValid] = useState(true);

  // When blurring the input, we set the value as the input value again since it should have the last valid value.
  const onInputBlur = () => {
    setInputValue(value ? transformLngLatToLocationType(value, gpsFormat) : '');
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
        // TODO (CRS): If the selected GPS format is a CRS, get the CRS object
        // from state.view.coordinateReferenceSystems.storedSystems.
        const lngLat = normalizeLocationTextToLngLat(event.target.value, gpsFormat);
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
      setInputValue(transformLngLatToLocationType(value, gpsFormat));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsFormat]);

  return <div ref={ref} role="group" {...otherProps}>
    <GpsFormatToggle
      onKeyDown={(event) => event.key === 'Enter' && innerInputRef.current.focus()}
      ref={gpsFormatToggleRef}
      showGpsString={false}
    />

    <div className={styles.inputWrapper}>
      <input
        aria-describedby={descriptionId}
        aria-errormessage={!isValid ? descriptionId : undefined}
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
      id={descriptionId}
    >
      {isValid
        ? t('inputDescription', { gpsFormat: GPS_FORMAT_EXAMPLES[gpsFormat] })
        : t('errorMessage')}
    </p>
  </div>;
};

export default memo(GpsInput);
