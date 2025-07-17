import React, { memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';
import { FEATURE_FLAG_LABELS } from '../constants';
import { GPS_FORMAT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { updateUserPreferences } from '../ducks/user-preferences';
import { useFeatureFlag } from '../hooks';

import TextCopyBtn from '../TextCopyBtn';

import * as styles from './styles.module.scss';

const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const GpsFormatToggle = ({ lat = null, lng = null, name, ref, showGpsString = true, ...otherProps }) => {
  const customCoordinateSystemsEnabled = useFeatureFlag(FEATURE_FLAG_LABELS.CUSTOM_COORDINATE_SYSTEMS_ENABLED);

  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'gpsFormatToggle' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const selectedCRS = useSelector((state) => state.view.coordinateReferenceSystems.selectedSystems);
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const fieldsetRef = useRef();
  const innerRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const gpsString = showGpsString && lat !== null && lng !== null ? calcGpsDisplayString(lat, lng, gpsFormat) : null;

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
    <fieldset className={styles.fieldset} ref={fieldsetRef}>
      <legend className={styles.legend}>{t('fieldsetLegend')}</legend>

      {/* TODO (CRS): Style label to be in a single line with ellipsis */}
      {gpsFormatOptions.map((gpsFormatOption) =>
        <label
          className={`${styles.label} ${gpsFormat === gpsFormatOption ? styles.active : ''}`}
          key={gpsFormatOption}
        >
          <input
            checked={gpsFormat === gpsFormatOption}
            className={styles.radioInput}
            name={name}
            onChange={() => onGpsFormatChange(gpsFormatOption)}
            ref={(element) => {
              if (gpsFormat === gpsFormatOption) {
                innerRef.current = element;
              }
            }}
            type="radio"
            value={gpsFormatOption}
          />

          {storedCRSMappedByCode[gpsFormatOption]?.name || gpsFormatOption}
        </label>)}
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
