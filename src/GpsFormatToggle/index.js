import React, { memo, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';

import { GPS_FORMAT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { OUTSIDE_BBOX, stringifyCoordinates } from '../utils/location';
import {
  selectCoordinatesRepresentation,
  selectStoredCoordinateReferenceSystemsMappedByCode,
} from '../selectors/location';
import { updateUserPreferences } from '../ducks/user-preferences';
import useStringifyCoordinates from '../hooks/useStringifyCoordinates';

import IconTooltip from '../IconTooltip';
import TextCopyBtn from '../TextCopyBtn';

import * as styles from './styles.module.scss';

const gpsFormatTracker = trackEventFactory(GPS_FORMAT_CATEGORY);

const GpsFormatToggle = ({
  className = '',
  isTextSearchOptionChecked = false,
  lngLat = null,
  name = null,
  ref,
  setIsTextSearchOptionChecked = null,
  showCoordinates = true,
  showTextSearchOption = false,
  ...otherProps
}) => {
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
  // The component may be rendered several times so we need a way to make the
  // HTML ids unique. This id is also used as a name fallback if the
  // implementator didn't provide one.
  const id = useId();

  const { coordinatesString, outsideRepresentationBbox } = useStringifyCoordinates(lngLat);

  const gpsFormatOptions = selectedCoordinateRepresentations.sort((optionA, optionB) => {
    // Sort coordinate representation options alphabetically. If they are a
    // CRS, we use the name property, otherwise we simply use the GPS format
    // string.
    const optionAName = storedCoordinateReferenceSystemsMappedByCode[optionA]?.name || optionA;
    const optionBName = storedCoordinateReferenceSystemsMappedByCode[optionB]?.name || optionB;
    return optionAName > optionBName ? 1 : -1;
  });

  const onGpsFormatChange = (gpsFormat) => {
    setIsTextSearchOptionChecked?.(false);

    dispatch(updateUserPreferences({ gpsFormat }));

    gpsFormatTracker.track('Change GPS Format', `GPS Format:${gpsFormat}`);
  };

  useEffect(() => {
    // Fixes a bug in when mounting map popups where the browser automatically
    // focuses the first input and not the one that is checked.
    setTimeout(() => {
      if (fieldsetRef.current?.contains(document.activeElement) && document.activeElement !== innerRef.current) {
        innerRef.current.focus();
      }
    });
  }, []);

  return <div className={`gps-format-toggle ${className}`} {...otherProps}>
    <fieldset className={styles.fieldset} ref={fieldsetRef} role="radiogroup">
      <legend className={styles.legend}>{t('fieldsetLegend')}</legend>

      {/* If the flag showTextSearchOption is true, the first option is the
      text search, which is handled through a controlled prop and not through
      the gpsFormat store variable. */}
      {showTextSearchOption && <div className={styles.radio}>
        <input
          checked={isTextSearchOptionChecked}
          className={styles.input}
          id={`${id}-text-search-radio`}
          name={name || id}
          onChange={() => setIsTextSearchOptionChecked?.(true)}
          ref={(element) => {
            if (isTextSearchOptionChecked) {
              innerRef.current = element;
            }
          }}
          type="radio"
          value={t('textSearchOptionLabel')}
        />

        <label
          className={`${styles.label} ${isTextSearchOptionChecked ? styles.active : ''}`}
          data-testid="gpsFormatToggle-textSearchOptionLabel"
          htmlFor={`${id}-text-search-radio`}
          title={t('textSearchOptionLabel')}
        >
          <SearchIcon aria-hidden />

          <span className="sr-only">{t('textSearchOptionLabel')}</span>
        </label>
      </div>}

      {gpsFormatOptions.map((gpsFormatOption) => {
        // If the option is a CRS and there is a lngLat, calculate if the
        // lngLat point is outside the BBOX.
        const gpsFormatCoordinateReferenceSystem = storedCoordinateReferenceSystemsMappedByCode[gpsFormatOption];
        const isLngLatOutsideCrsBbox = (gpsFormatCoordinateReferenceSystem && lngLat)
          ? stringifyCoordinates(lngLat, gpsFormatCoordinateReferenceSystem) === OUTSIDE_BBOX
          : false;

        // If this option is the store gpsFormat and the text search is not
        // checked, this option is checked.
        const isChecked = !isTextSearchOptionChecked && gpsFormat === gpsFormatOption;

        return <div className={styles.radio} key={gpsFormatOption}>
          <input
            checked={isChecked}
            className={styles.input}
            id={`${id}-${gpsFormatOption}-radio`}
            name={name || id}
            onChange={() => onGpsFormatChange(gpsFormatOption)}
            ref={(element) => {
              if (isChecked) {
                innerRef.current = element;
              }
            }}
            type="radio"
            value={gpsFormatOption}
          />

          <label
            className={`${styles.label} ${isChecked ? styles.active : ''} ${isLngLatOutsideCrsBbox ? styles.invalid : ''}`}
            htmlFor={`${id}-${gpsFormatOption}-radio`}
            title={gpsFormatCoordinateReferenceSystem?.name || gpsFormatOption}
          >
            {gpsFormatCoordinateReferenceSystem?.name || gpsFormatOption}
          </label>
        </div>;
      })}
    </fieldset>

    {showCoordinates && coordinatesString && <div className={styles.coordinatesStringWrapper}>
      <span aria-describedby={coordinatesOutsideBboxTooltipId} className={styles.coordinatesString}>
        {coordinatesString}
      </span>

      {outsideRepresentationBbox
        ? <IconTooltip
          aria-label={t('coordinatesOutsideBboxTooltipButtonLabel')}
          className={styles.coordinatesOutsideBboxTooltip}
          data-testid="gpsFormatToggle-coordinatesOutsideBboxTooltip"
          id={coordinatesOutsideBboxTooltipId}
          title={t('coordinatesOutsideBboxTooltipTitle', {
            crsName: coordinatesRepresentation.name,
            epsgCode: coordinatesRepresentation.code,
          })}
        />
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
