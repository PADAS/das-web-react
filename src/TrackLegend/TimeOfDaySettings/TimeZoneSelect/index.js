import React, { useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckLightIcon } from '../../../common/images/icons/check-light.svg';

import { setTimeOfDayTimeZone } from '../../../ducks/tracks';

import styles from './styles.module.scss';

const TIMEZONE_OFFSET_REGEX = /^(?:UTC|GMT)([+-])(\d{1,2})(?::(\d{2}))?$/;

const CustomDropdownIndicator = ({ selectProps, ...otherProps }) => <components.DropdownIndicator
    className={styles.dropdownIndicator}
    selectProps={selectProps}
    {...otherProps}
  >
  <div className={`${styles.caret} ${selectProps.menuIsOpen ? styles.menuOpen : ''}`} role="img" />
</components.DropdownIndicator>;

const CustomIndicatorSeparator = () => null;

const CustomOption = ({ data, isFocused, isSelected, ...otherProps }) => <div title={data.label}>
  <components.Option
    className={`${styles.option} ${isFocused ? styles.focused : ''} ${isSelected ? styles.selected : ''}`}
    isFocused={isFocused}
    isSelected={isSelected}
    {...otherProps}
  >
    {isSelected && <CheckLightIcon className={styles.checkLightIcon} />}

    <div className={styles.labelWrapper}>
      <p className={styles.label}>{data.title}</p>

      <p className={styles.description}>{data.description}</p>
    </div>
  </components.Option>
</div>;

const getTimeZoneParts = (ianaTimeZone, locales) => {
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

const compareTimeZoneParts = (timeZonePartsA, timeZonePartsB) => {
  // Get the time zone offset in minutes and make the total negative if the sign is "-".
  const timeZoneOffsetInMinutesA = ((timeZonePartsA.hours * 60) + timeZonePartsA.minutes)
    * (timeZonePartsA.sign === '-' ? -1 : 1);
  const timeZoneOffsetInMinutesB = ((timeZonePartsB.hours * 60) + timeZonePartsB.minutes)
    * (timeZonePartsB.sign === '-' ? -1 : 1);

  // Compare by the offset amount.
  if (timeZoneOffsetInMinutesA !== timeZoneOffsetInMinutesB) {
    return timeZoneOffsetInMinutesA - timeZoneOffsetInMinutesB;
  }
  // If the offset amount is the same, compare by the IANA time zone name alphabetically.
  return timeZonePartsA.ianaTimeZone.localeCompare(timeZonePartsB.ianaTimeZone);
};

const TimeZoneSelect = () => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation('tracks', { keyPrefix: 'trackLegend.timeOfDaySettings.timeZoneSelect' });

  const timeOfDayTimeZone = useSelector((state) => state.view.trackSettings.timeOfDayTimeZone);

  const options = useMemo(() => Intl.supportedValuesOf('timeZone')
    .map((ianaTimeZone) => getTimeZoneParts(ianaTimeZone, i18n.language))
    .sort(compareTimeZoneParts)
    .map((timeZoneParts) => {
      // Build the time zone offset in UTC+HH:mm format and humanize the IANA time zone text so its readable.
      const timeZoneOffsetInUTC = '(UTC'
        + timeZoneParts.sign
        + String(timeZoneParts.hours).padStart(2, '0')
        + ':'
        + String(timeZoneParts.minutes).padStart(2, '0')
        + ')';
      const humanizedIANATimeZone = timeZoneParts.ianaTimeZone.replaceAll('_', ' ').replaceAll('/', ' / ');

      // Return the option data, including all the texts in the label so they are searchable.
      return {
        description: timeZoneParts.longTimeZoneName,
        label: `${timeZoneOffsetInUTC} ${humanizedIANATimeZone} - ${timeZoneParts.longTimeZoneName}`,
        title: `${timeZoneOffsetInUTC} ${humanizedIANATimeZone}`,
        value: timeZoneParts.ianaTimeZone,
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
          singleValue: () => styles.singleValue,
        }}
        components={{
          DropdownIndicator: CustomDropdownIndicator,
          IndicatorSeparator: CustomIndicatorSeparator,
          Option: CustomOption,
        }}
        inputId="timeZoneSelect-input"
        // The absolute position of this item was hidding it behind other map legeds, attaching the portal to the body
        // fixes the issue. 
        menuPortalTarget={document.querySelector('body')}
        noOptionsMessage={() => t('noSelectOptionsMessage')}
        onChange={(newValue) => dispatch(setTimeOfDayTimeZone(newValue.value))}
        options={options}
        value={value}
      />
    </div>
  </div>;
};

export default TimeZoneSelect;
