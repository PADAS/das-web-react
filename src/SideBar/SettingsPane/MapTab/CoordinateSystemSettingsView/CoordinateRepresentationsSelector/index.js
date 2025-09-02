import React, { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TrashCanIcon } from '../../../../../common/images/icons/trash-can.svg';

import { GPS_FORMAT_EXAMPLES, GPS_FORMATS } from '../../../../../utils/location';
import { selectCoordinatesRepresentation } from '../../../../../selectors/location';
import {
  MAX_STORED_COORDINATE_REFERENCE_SYSTEMS,
  setSelectedCoordinateRepresentations,
  setStoredCoordinateReferenceSystems,
} from '../../../../../ducks/coordinate-reference-systems';
import { updateUserPreferences } from '../../../../../ducks/user-preferences';

import * as styles from './styles.module.scss';

const MAX_SELECTED_REPRESENTATIONS = 5;

const CoordinateReferenceSystemOption = ({ epsgCode, name }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.coordinateRepresentationsSelector',
  });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);
  const selectedCoordinateRepresentations = useSelector(
    (state) => state.view.coordinateReferenceSystems.selectedCoordinateRepresentations
  );
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const isChecked = selectedCoordinateRepresentations.includes(epsgCode);
  const isDisabled = !isChecked && selectedCoordinateRepresentations.length === MAX_SELECTED_REPRESENTATIONS;

  const onCheckboxChange = () => {
    if (isChecked) {
      if (coordinatesRepresentation?.code === epsgCode) {
        // If the user is unchecking the currently active representation,
        // set DEG as the active.
        dispatch(updateUserPreferences({ gpsFormat: GPS_FORMATS.DEG }));
      }

      dispatch(
        setSelectedCoordinateRepresentations(
          selectedCoordinateRepresentations.filter(
            (coordinatesRepresentation) => coordinatesRepresentation !== epsgCode
          )
        )
      );
    } else {
      dispatch(setSelectedCoordinateRepresentations([...selectedCoordinateRepresentations, epsgCode]));
    }
  };

  const onDelete = () => {
    if (isChecked) {
      // If a selected CRS is deleted from the list and it is checked, uncheck
      // it first.
      onCheckboxChange();
    }

    dispatch(setStoredCoordinateReferenceSystems(storedCRS.filter((storedCRS) => storedCRS.code !== epsgCode)));
  };

  return <div className={styles.coordinatesRepresentationOption}>
    <input
      checked={isChecked}
      className={styles.checkbox}
      disabled={isDisabled}
      id={`coordinate-representations-${epsgCode}-checkbox`}
      onChange={onCheckboxChange}
      type="checkbox"
    />

    <label
      className={`${styles.label} ${isDisabled ? styles.disabled : ''}`}
      htmlFor={`coordinate-representations-${epsgCode}-checkbox`}
      title={`EPSG:${epsgCode} ${name}`}
    >
      {`EPSG:${epsgCode} ${name}`}
    </label>

    <button
      aria-label={t('deleteCrsOptionButtonLabel', {
        coordinateReferenceSystemName: `EPSG:${epsgCode} ${name}`,
      })}
      className={styles.deleteButton}
      onClick={onDelete}
      title={t('deleteCrsOptionButtonLabel', {
        coordinateReferenceSystemName: `EPSG:${epsgCode} ${name}`,
      })}
      type="button"
    >
      <TrashCanIcon />
    </button>
  </div>;
};

const GpsFormatOption = ({ formatCode }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.coordinateRepresentationsSelector',
  });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);
  const selectedCoordinateRepresentations = useSelector(
    (state) => state.view.coordinateReferenceSystems.selectedCoordinateRepresentations
  );

  const isChecked = selectedCoordinateRepresentations.includes(formatCode);
  // DEG options is always disabled by design.
  const isDisabled = formatCode === GPS_FORMATS.DEG
    || (!isChecked && selectedCoordinateRepresentations.length === MAX_SELECTED_REPRESENTATIONS);

  const onCheckboxChange = () => {
    if (isChecked) {
      if (coordinatesRepresentation === formatCode) {
        // If the user is unchecking the currently active representation,
        // set DEG as the active.
        dispatch(updateUserPreferences({ gpsFormat: GPS_FORMATS.DEG }));
      }

      dispatch(
        setSelectedCoordinateRepresentations(
          selectedCoordinateRepresentations.filter(
            (coordinatesRepresentation) => coordinatesRepresentation !== formatCode
          )
        )
      );
    } else {
      dispatch(setSelectedCoordinateRepresentations([...selectedCoordinateRepresentations, formatCode]));
    }
  };

  return <div className={styles.defaultGpsFormatOptionWrapper}>
    <div className={styles.coordinatesRepresentationOption}>
      <input
        aria-describedby={`coordinate-representations-${formatCode}-example`}
        checked={isChecked}
        className={styles.checkbox}
        disabled={isDisabled}
        id={`coordinate-representations-${formatCode}-checkbox`}
        onChange={onCheckboxChange}
        type="checkbox"
      />

      <label
        className={`${styles.label} ${isDisabled ? styles.disabled : ''}`}
        htmlFor={`coordinate-representations-${formatCode}-checkbox`}
        title={t(`gpsFormatOptionLabel.${formatCode.toLowerCase()}`)}
      >
        {t(`gpsFormatOptionLabel.${formatCode.toLowerCase()}`)}
      </label>
    </div>

    <div
      className={`${styles.example} ${isDisabled ? styles.disabled : ''}`}
      id={`coordinate-representations-${formatCode}-example`}
    >
      {t('gpsFormatOptionExample', { example: GPS_FORMAT_EXAMPLES[formatCode] })}
    </div>
  </div>;
};

const CoordinateRepresentationsSelector = () => {
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.coordinateRepresentationsSelector',
  });

  const selectedCoordinateRepresentations = useSelector(
    (state) => state.view.coordinateReferenceSystems.selectedCoordinateRepresentations
  );
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const coordinateRepresentationOptions = [
    // Default GPS formats are always listed.
    ...Object.values(GPS_FORMATS).map((gpsFormat) => ({ formatCode: gpsFormat, isDefault: true })),
    ...storedCRS,
  ];

  return <div>
    <p className={styles.instructions} id="coordinate-representations-selector-instructions">
      {t('instructions')}
    </p>

    <fieldset
      aria-describedby="coordinate-representations-selector-instructions coordinate-representations-selector-message"
      className={styles.fieldset}
    >
      <legend className="sr-only">{t('legend')}</legend>

      {coordinateRepresentationOptions.map((coordinatesRepresentationOption, index) => <Fragment
        key={coordinatesRepresentationOption.isDefault
          ? coordinatesRepresentationOption.formatCode
          : coordinatesRepresentationOption.code}
      >
        {coordinatesRepresentationOption.isDefault
          ? <GpsFormatOption formatCode={coordinatesRepresentationOption.formatCode} />
          : <CoordinateReferenceSystemOption
            epsgCode={coordinatesRepresentationOption.code}
            name={coordinatesRepresentationOption.name}
          />}

        {index < (coordinateRepresentationOptions.length - 1) && <hr className={styles.separator} />}
      </Fragment>)}
    </fieldset>

    {selectedCoordinateRepresentations.length === MAX_SELECTED_REPRESENTATIONS && <p
        className={styles.message}
        id="coordinate-representations-selector-message"
        role="status"
      >
      {t('maximumOptionsSelectedMessage')}
    </p>}

    {storedCRS.length === MAX_STORED_COORDINATE_REFERENCE_SYSTEMS && <p className={styles.message}>
      {t('addedMaximumSystemsMessage')}
    </p>}
  </div>;
};

export default CoordinateRepresentationsSelector;
