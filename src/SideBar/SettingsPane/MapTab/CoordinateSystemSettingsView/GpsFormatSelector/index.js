import React, { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TrashCanIcon } from '../../../../../common/images/icons/trash-can.svg';

import { GPS_FORMAT_EXAMPLES, GPS_FORMATS } from '../../../../../utils/location';
import {
  setSelectedCoordinateReferenceSystems,
  setStoredCoordinateReferenceSystems,
} from '../../../../../ducks/coordinate-reference-systems';
import { updateUserPreferences } from '../../../../../ducks/user-preferences';

import * as styles from './styles.module.scss';

const MAX_SELECTED_GPS_FORMATS = 5;

const CrsGpsFormatOption = ({ epsgCode, name }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.gpsFormatSelector',
  });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const selectedCRS = useSelector((state) => state.view.coordinateReferenceSystems.selectedSystems);
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const isChecked = selectedCRS.includes(epsgCode);
  const isDisabled = !isChecked && selectedCRS.length === MAX_SELECTED_GPS_FORMATS;

  const onCheckboxChange = () => {
    if (isChecked) {
      if (gpsFormat === epsgCode) {
        // If the user is unchecking the CRS that is the current GPS format
        // established in the user preferences, update the preferences to DEG.
        dispatch(updateUserPreferences({ gpsFormat: GPS_FORMATS.DEG }));
      }

      dispatch(
        setSelectedCoordinateReferenceSystems(
          selectedCRS.filter((selectedCRSIdentifier) => selectedCRSIdentifier !== epsgCode)
        )
      );
    } else {
      dispatch(setSelectedCoordinateReferenceSystems([...selectedCRS, epsgCode]));
    }
  };

  const onDelete = () => {
    if (isChecked) {
      // If a selected CRS GPS format is deleted from the list and it is
      // checked, uncheck it first.
      onCheckboxChange();
    }

    dispatch(setStoredCoordinateReferenceSystems(storedCRS.filter((storedCRS) => storedCRS.code !== epsgCode)));
  };

  return <div className={styles.gpsFormatOption}>
    <input
      checked={isChecked}
      className={styles.checkbox}
      disabled={isDisabled}
      id={`gps-format-${epsgCode}-checkbox`}
      onChange={onCheckboxChange}
      type="checkbox"
    />

    <label
      className={`${styles.label} ${isDisabled ? styles.disabled : ''}`}
      htmlFor={`gps-format-${epsgCode}-checkbox`}
      title={`EPSG:${epsgCode} ${name}`}
    >
      {`EPSG:${epsgCode} ${name}`}
    </label>

    <button
      aria-label={t('deleteGpsFormatOptionButtonLabel', {
        coordinateReferenceSystemName: `EPSG:${epsgCode} ${name}`,
      })}
      className={styles.deleteButton}
      onClick={onDelete}
      title={t('deleteGpsFormatOptionButtonLabel', {
        coordinateReferenceSystemName: `EPSG:${epsgCode} ${name}`,
      })}
      type="button"
    >
      <TrashCanIcon />
    </button>
  </div>;
};

const DefaultGpsFormatOption = ({ formatCode }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.gpsFormatSelector',
  });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const selectedCRS = useSelector((state) => state.view.coordinateReferenceSystems.selectedSystems);

  const isChecked = selectedCRS.includes(formatCode);
  // DEG options is always disabled by design.
  const isDisabled = formatCode === GPS_FORMATS.DEG
    || (!isChecked && selectedCRS.length === MAX_SELECTED_GPS_FORMATS);

  const onCheckboxChange = () => {
    if (isChecked) {
      if (gpsFormat === formatCode) {
        // If the user is unchecking the format that is the current GPS format
        // established in the user preferences, update the preferences to DEG.
        dispatch(updateUserPreferences({ gpsFormat: GPS_FORMATS.DEG }));
      }

      dispatch(
        setSelectedCoordinateReferenceSystems(
          selectedCRS.filter((selectedCRSIdentifier) => selectedCRSIdentifier !== formatCode)
        )
      );
    } else {
      dispatch(setSelectedCoordinateReferenceSystems([...selectedCRS, formatCode]));
    }
  };

  return <div className={styles.defaultGpsFormatOptionWrapper}>
    <div className={styles.gpsFormatOption}>
      <input
        aria-describedby={`gps-format-${formatCode}-example`}
        checked={isChecked}
        className={styles.checkbox}
        disabled={isDisabled}
        id={`gps-format-${formatCode}-checkbox`}
        onChange={onCheckboxChange}
        type="checkbox"
      />

      <label
        className={`${styles.label} ${isDisabled ? styles.disabled : ''}`}
        htmlFor={`gps-format-${formatCode}-checkbox`}
        title={t(`gpsFormatOptionLabel.${formatCode.toLowerCase()}`)}
      >
        {t(`gpsFormatOptionLabel.${formatCode.toLowerCase()}`)}
      </label>
    </div>

    <div
      className={`${styles.example} ${isDisabled ? styles.disabled : ''}`}
      id={`gps-format-${formatCode}-example`}
    >
      {t('gpsFormatOptionExample', { example: GPS_FORMAT_EXAMPLES[formatCode] })}
    </div>
  </div>;
};

const GpsFormatSelector = () => {
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.gpsFormatSelector',
  });

  const selectedCRS = useSelector((state) => state.view.coordinateReferenceSystems.selectedSystems);
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const gpsFormatOptions = [
    // Default GPS formats are always listed.
    ...Object.values(GPS_FORMATS).map((gpsFormat) => ({ formatCode: gpsFormat, isDefault: true })),
    ...storedCRS,
  ];

  return <div>
    <p className={styles.instructions} id="gps-format-selector-instructions">
      {t('instructions')}
    </p>

    <fieldset
      aria-describedby="gps-format-selector-instructions gps-format-selector-message"
      className={styles.fieldset}
    >
      <legend className={styles.srOnly}>{t('legend')}</legend>

      {gpsFormatOptions.map((gpsFormatOption, index) => <Fragment
        key={gpsFormatOption.isDefault ? gpsFormatOption.formatCode : gpsFormatOption.code}
      >
        {gpsFormatOption.isDefault
          ? <DefaultGpsFormatOption formatCode={gpsFormatOption.formatCode} />
          : <CrsGpsFormatOption epsgCode={gpsFormatOption.code} name={gpsFormatOption.name} />}

        {index < (gpsFormatOptions.length - 1) && <hr className={styles.separator} />}
      </Fragment>)}
    </fieldset>

    {selectedCRS.length === MAX_SELECTED_GPS_FORMATS && <p
        className={styles.message}
        id="gps-format-selector-message"
        role="status"
      >
      {t('maximumOptionsSelectedMessage')}
    </p>}
  </div>;
};

export default GpsFormatSelector;
