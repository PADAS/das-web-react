import React, { useEffect, useMemo, useRef } from 'react';
import Select, { components } from 'react-select';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckLightIcon } from '../../../common/images/icons/check-light.svg';

import { setTimeOfDayTimeZone } from '../../../ducks/tracks';

import styles from './styles.module.scss';

const TIMEZONE_OFFSET_REGEX = /^(?:UTC|GMT)([+-])(\d{1,2})(?::(\d{2}))?$/;

const CustomIndicatorSeparator = () => null;

const CustomOption = ({ data, isFocused, isSelected, ...restProps }) => <div title={data.label}>
  <components.Option
    className={`${styles.option} ${isFocused ? styles.focused : ''} ${isSelected ? styles.selected : ''}`}
    isFocused={isFocused}
    isSelected={isSelected}
    {...restProps}
  >
    {isSelected && <CheckLightIcon className={styles.checkLightIcon} />}

    <p className={styles.label}>
      {data.title}

      <br />

      <span className={styles.description}>{data.description}</span>
    </p>
  </components.Option>
</div>;

const getTimeZoneOffsetParts = (ianaTimeZone, locales) => {
  const now = new Date();

  // Get the localized long time zone name.
  const englishLongFormatterForTimeZone = new Intl.DateTimeFormat(locales, {
    timeZone: ianaTimeZone,
    timeZoneName: 'long',
  });
  const nowFormattedToEnglishLongTimeZoneNameParts = englishLongFormatterForTimeZone.formatToParts(now);
  const longTimeZoneName = nowFormattedToEnglishLongTimeZoneNameParts.find((part) => part.type === 'timeZoneName').value;

  // Get the short offset time zone name in english (we don't care about localization for this format).
  const englishShortOffsetFormatterForTimeZone = new Intl.DateTimeFormat('en', {
    timeZone: ianaTimeZone,
    timeZoneName: 'shortOffset',
  });
  const nowFormattedToEnglishShortOffsetTimeZoneNameParts = englishShortOffsetFormatterForTimeZone.formatToParts(now);
  const shortOffsetTimeZoneName = nowFormattedToEnglishShortOffsetTimeZoneNameParts
    .find((part) => part.type === 'timeZoneName').value;

  // Extract the sign, hour and minute and return all the parts.
  const match = shortOffsetTimeZoneName.match(TIMEZONE_OFFSET_REGEX);
  if (match) {
    return {
      hours: parseInt(match[2]),
      ianaTimeZone,
      longTimeZoneName,
      minutes: match[3] ? parseInt(match[3]) : 0,
      sign: match[1],
    };
  }
  return { hours: 0, ianaTimeZone, longTimeZoneName, minutes: 0, sign: '+' };
};

const compareTimeZoneOffsetParts = (timeZoneOffsetPartsA, timeZoneOffsetPartsB) => {
  // Get the time zone offset in minutes and make the total negative if the sign is "-".
  const timeZoneOffsetInMinutesA = ((timeZoneOffsetPartsA.hours * 60) + timeZoneOffsetPartsA.minutes)
    * (timeZoneOffsetPartsA.sign === '-' ? -1 : 1);
  const timeZoneOffsetInMinutesB = ((timeZoneOffsetPartsB.hours * 60) + timeZoneOffsetPartsB.minutes)
    * (timeZoneOffsetPartsB.sign === '-' ? -1 : 1);

  // Compare by the offset amount.
  if (timeZoneOffsetInMinutesA !== timeZoneOffsetInMinutesB) {
    return timeZoneOffsetInMinutesA - timeZoneOffsetInMinutesB;
  }
  // If the offset amount is the same, compare by the IANA time zone name alphabetically.
  return timeZoneOffsetPartsA.ianaTimeZone.localeCompare(timeZoneOffsetPartsB.ianaTimeZone);
};

const TimeZoneSelect = () => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend.timeOfDaySettings.timeZoneSelect' });

  const timeOfDayTimeZone = useSelector((state) => state.view.trackSettings.timeOfDayTimeZone);

  const inputRef = useRef();

  const options = useMemo(() => Intl.supportedValuesOf('timeZone')
    .map((ianaTimeZone) => getTimeZoneOffsetParts(ianaTimeZone, i18n.language))
    .sort(compareTimeZoneOffsetParts)
    .map((timeZoneOffsetParts) => {
      // Build the time zone offset in UTC+HH:mm format and humanize the IANA time zone text so its readable.
      const timeZoneOffsetInUTC = '(UTC'
        + timeZoneOffsetParts.sign
        + String(timeZoneOffsetParts.hours).padStart(2, '0')
        + ':'
        + String(timeZoneOffsetParts.minutes).padStart(2, '0')
        + ')';
      const humanizedIANATimeZone = timeZoneOffsetParts.ianaTimeZone.replaceAll('_', ' ').replaceAll('/', ' / ');

      // Return the option data, including all the texts in the label so they are searchable.
      return {
        description: timeZoneOffsetParts.longTimeZoneName,
        label: `${timeZoneOffsetInUTC} ${humanizedIANATimeZone} - ${timeZoneOffsetParts.longTimeZoneName}`,
        title: `${timeZoneOffsetInUTC} ${humanizedIANATimeZone}`,
        value: timeZoneOffsetParts.ianaTimeZone,
      };
    }), [i18n.language]);

  const value = useMemo(
    () => options.find((option) => option.value === timeOfDayTimeZone),
    [options, timeOfDayTimeZone]
  );

  useEffect(() => {
    if (!timeOfDayTimeZone) {
      // If the user hasn't set a time of day time zone manually we set their time zone by default.
      dispatch(setTimeOfDayTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone));
    }
  }, [dispatch, timeOfDayTimeZone]);

  return <div className={styles.timeZoneSelect}>
    <label className={styles.label} htmlFor="timeZoneSelect-input">{t('label')}</label>

    <div className={styles.inputWrapper} title={value?.label}>
      <Select
        classNames={{
          control: (state) => `${styles.control} ${state.isFocused ? styles.focused : ''}`,
          menuList: () => styles.menuList,
          indicatorsContainer: () => styles.indicatorsContainer,
        }}
        components={{ IndicatorSeparator: CustomIndicatorSeparator, Option: CustomOption }}
        inputId="timeZoneSelect-input"
        noOptionsMessage={() => t('noSelectOptionsMessage')}
        onChange={(newValue) => dispatch(setTimeOfDayTimeZone(newValue.value))}
        options={options}
        ref={(ref) => {
          if (ref) {
            inputRef.current = ref.inputRef;
          }
        }}
        value={value}
      />
    </div>
  </div>;
};

export default TimeZoneSelect;
