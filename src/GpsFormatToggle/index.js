import React, { memo, useEffect, useId, useImperativeHandle, useMemo, useRef } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TriangleExclamationIcon } from '../common/images/icons/triangle-exclamation.svg';

import { FEATURE_FLAG_LABELS } from '../constants';
import { GPS_FORMAT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { GPS_FORMATS, OUTSIDE_BBOX, stringifyCoordinates } from '../utils/location';
import {
  selectCoordinatesRepresentation,
  selectStoredCoordinateReferenceSystemsMappedByCode,
} from '../selectors/location';
import { updateUserPreferences } from '../ducks/user-preferences';
import { useFeatureFlag } from '../hooks';

import TextCopyBtn from '../TextCopyBtn';

import * as styles from './styles.module.scss';

const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const GpsFormatToggle = ({
  className = '',
  lngLat = null,
  name = null,
  ref,
  showCoordinates = true,
  ...otherProps
}) => {
  const customCoordinateSystemsEnabled = useFeatureFlag(FEATURE_FLAG_LABELS.CUSTOM_COORDINATE_SYSTEMS_ENABLED);

  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'gpsFormatToggle' });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);
  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const selectedCoordinateRepresentations = useSelector(
    (state) => state.view.coordinateReferenceSystems.selectedCoordinateRepresentations
  );
  const storedCoordinateReferenceSystemsMappedByCode = useSelector(selectStoredCoordinateReferenceSystemsMappedByCode);

  const fieldsetRef = useRef();
  const innerRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const coordinatesOutsideBboxTooltipId = useId();
  // We need to provide a name for the radio group to behave correctly, so we
  // add a fallback in case the implementator didn't provide one.
  const nameFallback = useId();

  const gpsFormatOptions = customCoordinateSystemsEnabled
    ? selectedCoordinateRepresentations.sort((optionA, optionB) => {
      // Sort coordinate representation options alphabetically. If they are a
      // CRS, we use the name property, otherwise we simply use the GPS format
      // string.
      const optionAName = storedCoordinateReferenceSystemsMappedByCode[optionA]?.name || optionA;
      const optionBName = storedCoordinateReferenceSystemsMappedByCode[optionB]?.name || optionB;
      return optionAName > optionBName ? 1 : -1;
    })
    : Object.values(GPS_FORMATS);

  const { areCoordinatesOutsideCrsBbox, coordinatesString } = useMemo(() => {
    if (showCoordinates && lngLat) {
      // Calculate the coordinates string in the current GPS format and if it
      // falls outside the BBOX of the CRS, fallback to degrees.
      const coordinatesString = stringifyCoordinates(lngLat, coordinatesRepresentation);
      if (coordinatesString === OUTSIDE_BBOX) {
        return { areCoordinatesOutsideCrsBbox: true, coordinatesString: stringifyCoordinates(lngLat) };
      }
      return { areCoordinatesOutsideCrsBbox: false, coordinatesString };
    }

    return { areCoordinatesOutsideCrsBbox: false, coordinatesString: null };
  }, [coordinatesRepresentation, lngLat, showCoordinates]);

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

  return <div className={`gps-format-toggle ${className}`} {...otherProps}>
    <fieldset className={styles.fieldset} ref={fieldsetRef} role="radiogroup">
      <legend className={styles.legend}>{t('fieldsetLegend')}</legend>

      {gpsFormatOptions.map((gpsFormatOption) => {
        // If the option is a CRS and there is a lngLat, calculate if the
        // lngLat point is outside the BBOX.
        const gpsFormatCoordinateReferenceSystem = storedCoordinateReferenceSystemsMappedByCode[gpsFormatOption];
        const isLngLatOutsideCrsBbox = (gpsFormatCoordinateReferenceSystem && lngLat)
          ? stringifyCoordinates(lngLat, gpsFormatCoordinateReferenceSystem) === OUTSIDE_BBOX
          : false;

        return <div className={styles.radio} key={gpsFormatOption}>
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
            className={`${styles.label} ${gpsFormat === gpsFormatOption ? styles.active : ''} ${isLngLatOutsideCrsBbox ? styles.invalid : ''}`}
            htmlFor={`${gpsFormatOption}-radio`}
            title={gpsFormatCoordinateReferenceSystem?.name || gpsFormatOption}
          >
            {gpsFormatCoordinateReferenceSystem?.name || gpsFormatOption}
          </label>
        </div>;
      })}
    </fieldset>

    {coordinatesString && <div className={styles.coordinatesStringWrapper}>
      <span aria-describedby={coordinatesOutsideBboxTooltipId} className={styles.coordinatesString}>
        {coordinatesString}
      </span>

      {areCoordinatesOutsideCrsBbox
        ? <>
          <OverlayTrigger
            overlay={(props) => <Tooltip {...props} arrowProps={{ style: { display: 'none' } }}>
              {t('coordinatesOutsideBboxTooltip', {
                crsName: coordinatesRepresentation.name,
                epsgCode: coordinatesRepresentation.code,
              })}
            </Tooltip>}
            placement="bottom"
          >
            <button
              aria-hidden
              aria-label={t('coordinatesOutsideBboxTooltipButtonLabel')}
              className={styles.coordinatesOutsideBboxTooltipButton}
              data-testid="gpsFormatToggle-coordinatesOutsideBboxTooltipButton"
              type="button"
            >
              <TriangleExclamationIcon />
            </button>
          </OverlayTrigger>

          <p className="sr-only" id={coordinatesOutsideBboxTooltipId}>
            {t('coordinatesOutsideBboxTooltip', {
              crsName: coordinatesRepresentation.name,
              epsgCode: coordinatesRepresentation.code,
            })}
          </p>
        </>
        : <TextCopyBtn
          aria-label={t('textCopyButtonLabel')}
          className={styles.textCopyButton}
          text={coordinatesString}
          title={t('textCopyButtonLabel')}
        />}
    </div>}
  </div>;
};

export default memo(GpsFormatToggle);
