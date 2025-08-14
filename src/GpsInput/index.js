import React, { memo, useEffect, useId, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  GPS_FORMAT_EXAMPLES,
  OUTSIDE_BBOX,
  parseCoordinates,
  stringifyCoordinates,
  validateLngLat,
} from '../utils/location';
import { selectCoordinatesRepresentation } from '../selectors/location';

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

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  const innerInputRef = useRef();

  const descriptionId = useId();
  const errorMessageId = useId();

  // The input value is handled locally to accept any input, but we just
  // trigger onChange when the value is valid.
  const [inputValue, setInputValue] = useState(() => value
    ? stringifyCoordinates(value, coordinatesRepresentation)
    : '');
  const [isInputValueValid, setIsInputValueValid] = useState(true);

  // When blurring the input, we set the value as the input value again since
  // it should have the last valid value.
  const onInputBlur = () => {
    setInputValue(value ? stringifyCoordinates(value, coordinatesRepresentation) : '');
    setIsInputValueValid(true);
  };

  const onInputChange = (event) => {
    setInputValue(event.target.value);

    if (!event.target.value) {
      // If the input was emptied, it is valid.
      setIsInputValueValid(true);
      onChange(null);
    } else {
      try {
        // Frist we try to parse the input value from the current location
        // type to a lngLat object.
        const lngLat = parseCoordinates(event.target.value, coordinatesRepresentation);

        const isInputValueValidLocation = validateLngLat(lngLat.longitude, lngLat.latitude);
        setIsInputValueValid(isInputValueValidLocation);

        if (isInputValueValidLocation) {
          // If the input value is valid, trigger onChange.
          onChange(lngLat);
        }
      } catch (error) {
        setIsInputValueValid(false);
      }
    }
  };

  useEffect(() => {
    if (value) {
      // If the user changes the coordinates representation, we transform the input value to the new format.
      setInputValue(stringifyCoordinates(value, coordinatesRepresentation));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinatesRepresentation]);

  // We set the input in an error state if the current value is an invalid
  // location or it is outside of the BBOX of the CRS.
  const isInputValid = isInputValueValid && inputValue !== OUTSIDE_BBOX;

  return <div ref={ref} role="group" {...otherProps}>
    <GpsFormatToggle
      lngLat={value}
      onKeyDown={(event) => event.key === 'Enter' && innerInputRef.current.focus()}
      ref={gpsFormatToggleRef}
      showCoordinates={false}
    />

    <div className={styles.inputWrapper}>
      <input
        aria-describedby={isInputValid ? descriptionId : undefined}
        aria-errormessage={!isInputValid ? errorMessageId : undefined}
        aria-invalid={!isInputValid}
        aria-label={t('inputLabel')}
        className={styles.input}
        id={id}
        onBlur={onInputBlur}
        onChange={onInputChange}
        placeholder={coordinatesRepresentation
          ? coordinatesRepresentation?.name || t(`placeholders.${coordinatesRepresentation}`)
          : t('defaultPlaceholder')}
        ref={(element) => {
          if (inputRef) {
            inputRef.current = element;
          }
          innerInputRef.current = element;
        }}
        type="text"
        // If the value is outside of the BBOX of the CRS, show N/A.
        value={inputValue === OUTSIDE_BBOX ? t('outsideBboxInputValue') : inputValue}
      />

      {renderButton?.()}
    </div>

    {isInputValid && typeof coordinatesRepresentation === 'string' && <p
      className={styles.description}
      id={descriptionId}
    >
      {t('inputDescription', { gpsFormat: GPS_FORMAT_EXAMPLES[coordinatesRepresentation] })}
    </p>}

    {!isInputValid && <p aria-live="assertive" className={`${styles.description} ${styles.error}`} id={errorMessageId}>
      {coordinatesRepresentation?.code && inputValue === OUTSIDE_BBOX
        ? t('outsideBboxErrorMessage', {
          crsName: coordinatesRepresentation.name,
          epsgCode: coordinatesRepresentation.code,
        })
        : t('invalidLocationErrorMessage')}
    </p>}
  </div>;
};

export default memo(GpsInput);
