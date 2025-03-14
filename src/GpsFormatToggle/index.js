import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';
import { GPS_FORMAT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { updateUserPreferences } from '../ducks/user-preferences';

import TextCopyBtn from '../TextCopyBtn';

import styles from './styles.module.scss';

const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const GpsFormatToggle = ({ lat = null, lng = null, name, showGpsString = true, ...otherProps }, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'gpsFormatToggle' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const fieldsetRef = useRef();
  const innerRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const gpsString = showGpsString && lat !== null && lng !== null ? calcGpsDisplayString(lat, lng, gpsFormat) : null;

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

      {Object.values(GPS_FORMATS).map((itemGpsFormat) =>
        <label
          className={`${styles.label} ${gpsFormat === itemGpsFormat ? styles.active : ''}`}
          key={itemGpsFormat}
        >
          <input
            checked={gpsFormat === itemGpsFormat}
            className={styles.radioInput}
            name={name}
            onChange={() => onGpsFormatChange(itemGpsFormat)}
            ref={(element) => {
              if (gpsFormat === itemGpsFormat) {
                innerRef.current = element;
              }
            }}
            type="radio"
            value={itemGpsFormat}
          />

          {itemGpsFormat}
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

export default memo(forwardRef(GpsFormatToggle));
