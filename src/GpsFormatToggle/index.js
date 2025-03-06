import React, { forwardRef, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';
import { GPS_FORMAT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { updateUserPreferences } from '../ducks/user-preferences';

import TextCopyBtn from '../TextCopyBtn';

import styles from './styles.module.scss';

const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const GpsFormatToggle = ({
  lat = null,
  lng = null,
  name,
  showCopyControl = null,
  showGpsString = true,
  ...otherProps
}, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'gpsFormatToggle' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const gpsString = showGpsString ? calcGpsDisplayString(lat, lng, gpsFormat) : null;

  const onGpsFormatChange = (gpsFormat) => {
    dispatch(updateUserPreferences({ gpsFormat }));

    gpsFormatTracker.track('Change GPS Format', `GPS Format:${gpsFormat}`);
  };

  return <div {...otherProps}>
    <fieldset className={styles.fieldset}>
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
              if (ref && gpsFormat === itemGpsFormat) {
                ref.current = element;
              }
            }}
            type="radio"
            value={itemGpsFormat}
          />

          {itemGpsFormat}
        </label>)}
    </fieldset>

    {gpsString && <div className={styles.gpsStringWrapper}>
      <span className={styles.value} data-testid="gpsFormatToggle-gpsString">{gpsString}</span>

      {(showCopyControl ?? showGpsString) && <TextCopyBtn text={gpsString} />}
    </div>}
  </div>;
};

export default memo(forwardRef(GpsFormatToggle));
