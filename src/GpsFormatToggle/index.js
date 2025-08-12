import React, { memo, useEffect, useId, useImperativeHandle, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { FEATURE_FLAG_LABELS } from '../constants';
import { GPS_FORMAT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { GPS_FORMATS, transformLngLatToLocationType } from '../utils/location';
import { updateUserPreferences } from '../ducks/user-preferences';
import { useFeatureFlag } from '../hooks';

import TextCopyBtn from '../TextCopyBtn';

import * as styles from './styles.module.scss';

const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const SIZES = { NORMAL: 'normal', SMALL: 'small' };

const GpsFormatToggle = ({
  lat = null,
  lng = null,
  name = null,
  ref,
  showGpsString = true,
  size = SIZES.NORMAL,
  ...otherProps
}) => {
  const customCoordinateSystemsEnabled = useFeatureFlag(FEATURE_FLAG_LABELS.CUSTOM_COORDINATE_SYSTEMS_ENABLED);

  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'gpsFormatToggle' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const selectedCRS = useSelector((state) => state.view.coordinateReferenceSystems.selectedSystems);
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const fieldsetRef = useRef();
  const innerRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const nameFallback = useId();

  const gpsString = (showGpsString && lat !== null && lng !== null)
    ? transformLngLatToLocationType({ latitude: lat, longitude: lng }, gpsFormat)
    : null;

  const gpsFormatOptions = customCoordinateSystemsEnabled ? selectedCRS : Object.values(GPS_FORMATS);

  const storedCRSMappedByCode = useMemo(() => storedCRS.reduce((accumulator, storedSystem) => {
    accumulator[storedSystem.code] = storedSystem;
    return accumulator;
  }, {}), [storedCRS]);

  const onGpsFormatChange = (gpsFormat) => {
    dispatch(updateUserPreferences({ gpsFormat }));

    gpsFormatTracker.track('Change GPS Format', `GPS Format:${gpsFormat}`);
  };

  useEffect(() => {
    // Fixes a bug in when mounting map popups where the browser automatically focuses the first input and not the
    // one that is checked.
    setTimeout(() => {
      if (fieldsetRef.current?.contains(document.activeElement) && document.activeElement !== innerRef.current) {
        innerRef.current.focus();
      }
    });
  }, []);

  return <div {...otherProps}>
    <fieldset className={styles.fieldset} ref={fieldsetRef} role="radiogroup">
      <legend className={styles.legend}>{t('fieldsetLegend')}</legend>

      {gpsFormatOptions.map((gpsFormatOption) =>
        <div className={styles.radio} key={gpsFormatOption}>
          <input
            checked={gpsFormat === gpsFormatOption}
            className={styles.input}
            id={`${gpsFormatOption}-radio`}
            name={name || nameFallback}
            onChange={() => onGpsFormatChange(gpsFormatOption)}
            ref={(element) => {
              if (gpsFormat === gpsFormatOption) {
                innerRef.current = element;
              }
            }}
            type="radio"
            value={gpsFormatOption}
          />

          <label
            className={`${styles.label} ${gpsFormat === gpsFormatOption ? styles.active : ''} ${size === SIZES.SMALL ? styles.small : '' }`}
            htmlFor={`${gpsFormatOption}-radio`}
            title={storedCRSMappedByCode[gpsFormatOption]?.name || gpsFormatOption}
          >
            {storedCRSMappedByCode[gpsFormatOption]?.name || gpsFormatOption}
          </label>
        </div>)}
    </fieldset>

    {gpsString && <div className={styles.gpsStringWrapper}>
      <span className={styles.value}>{gpsString}</span>

      <TextCopyBtn
        aria-label={t('textCopyButtonLabel')}
        className={styles.textCopyButton}
        text={gpsString}
        title={t('textCopyButtonLabel')}
      />
    </div>}
  </div>;
};

export default memo(GpsFormatToggle);
