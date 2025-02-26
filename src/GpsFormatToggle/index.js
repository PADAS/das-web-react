import React, { forwardRef, memo, useRef } from 'react';
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
  showCopyControl = null,
  showGpsString = true,
  ...otherProps
}, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'gpsFormatToggle' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const tabRefs = useRef([]);

  const gpsString = showGpsString ? calcGpsDisplayString(lat, lng, gpsFormat) : null;

  const onTabClick = (gpsFormat, index) => {
    dispatch(updateUserPreferences({ gpsFormat }));

    tabRefs.current[index]?.focus();

    gpsFormatTracker.track('Change GPS Format', `GPS Format:${gpsFormat}`);
  };

  const onKeyDown = (event) => {
    const gpsFormatsArray = Object.values(GPS_FORMATS);
    const activeIndex = Object.values(GPS_FORMATS).indexOf(gpsFormat);

    let newGpsFormatIndex;
    if (event.key === 'ArrowRight') {
      newGpsFormatIndex = (activeIndex + 1) % gpsFormatsArray.length;
    } else if (event.key === 'ArrowLeft') {
      newGpsFormatIndex = (activeIndex - 1 + gpsFormatsArray.length) % gpsFormatsArray.length;
    } else if (event.key === 'Home') {
      newGpsFormatIndex = 0;
    } else if (event.key === 'End') {
      newGpsFormatIndex = gpsFormatsArray.length - 1;
    }

    if (newGpsFormatIndex !== undefined) {
      dispatch(updateUserPreferences({ gpsFormat: gpsFormatsArray[newGpsFormatIndex] }));
      tabRefs.current[newGpsFormatIndex]?.focus();
    }
  };

  return <div {...otherProps}>
    <div aria-label={t('tabsLabel')} className={styles.tabs} role="tablist">
      {Object.values(GPS_FORMATS).map((itemGpsFormat, index) => <button
        aria-selected={gpsFormat === itemGpsFormat}
        className={`${styles.tab} ${gpsFormat === itemGpsFormat ? styles.active : ''}`}
        id={`${itemGpsFormat}-tab`}
        key={itemGpsFormat}
        onClick={() => onTabClick(itemGpsFormat, index)}
        onKeyDown={onKeyDown}
        onMouseDown={(event) => event.preventDefault()}
        ref={(element) => {
          if (ref && gpsFormat === itemGpsFormat) {
            ref.current = element;
          }
          tabRefs.current[index] = element;
        }}
        role="tab"
        tabIndex={gpsFormat === itemGpsFormat ? 0 : -1}
        type="button"
      >
        {itemGpsFormat}
      </button>)}
    </div>

    {gpsString && <div className={styles.gpsStringWrapper}>
      <span className={styles.value} data-testid="gpsFormatToggle-gpsString">{gpsString}</span>

      {(showCopyControl ?? showGpsString) && <TextCopyBtn text={gpsString} />}
    </div>}
  </div>;
};

export default memo(forwardRef(GpsFormatToggle));
