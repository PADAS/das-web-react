import React, { memo, useCallback, useContext, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PolygonIcon } from '../../../common/images/icons/polygon.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import { hideSideBar, showSideBar } from '../../../ducks/side-bar';
import {
  MAP_LOCATION_SELECTION_MODES,
  setIsPickingLocation,
  setMapLocationSelectionEvent,
} from '../../../ducks/map-ui';
import { MapDrawingToolsContext } from '../../../MapDrawingTools/ContextProvider';
import { setModalVisibilityState } from '../../../ducks/modals';
import { useEventGeoMeasurementDisplayStrings } from '../../../hooks/geometry';

import MenuPopover from './MenuPopover';
import TextCopyBtn from '../../../TextCopyBtn';

import * as styles from './styles.module.scss';

// TODO: This is a common component and its events shouldn't be linked to the event report track category.
const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const GEOMETRY_PROVENANCE_WEB = 'web';

const AreaPicker = ({
  className = '',
  disabled = false,
  event,
  id,
  inputProps = {},
  name = '',
  onBlur = null,
  onChange,
  onFocus = null,
  placeholder = null,
  readOnly = false,
  ref,
  required = false,
  value,
  ...otherProps
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.areaPicker' });

  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const isDrawingEventGeometry = useSelector((state) => state.view.mapLocationSelection.isPickingLocation
    && state.view.mapLocationSelection.mode === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY);
  const originalEvent = useSelector((state) => state.data.eventStore[event.id]);

  const { mapDrawingData, setMapDrawingData } = useContext(MapDrawingToolsContext);

  const innerRef = useRef();
  const setAreaButtonRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const inputDescriptionId = useId();
  const menuPopoverId = useId();

  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = useState(false);

  const [perimeterDisplayString, areaDisplayString] = useEventGeoMeasurementDisplayStrings(event, originalEvent);

  // Update the store so the application shows or hides the views over the map
  // so the user can pick an area in it.
  const setAppToShowMapMode = useCallback((showMapMode = true) => {
    dispatch(setIsPickingLocation(showMapMode, MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY));
    dispatch(setModalVisibilityState(!showMapMode));
    dispatch(showMapMode ? hideSideBar() : showSideBar());
  }, [dispatch]);

  const onPickArea = () => {
    dispatch(setMapLocationSelectionEvent(event));
    setAppToShowMapMode();

    if (!value) {
      eventReportTracker.track('Click set area to add area to report');
    } else if (value?.properties?.provenance) {
      eventReportTracker.track(`Edit an event geometry generated in ER ${value?.properties?.provenance}`);
    } else {
      eventReportTracker.track('Edit an event geometry');
    }
  };

  useEffect(() => {
    if (!isPickingLocation && mapDrawingData) {
      // If the map drawing tools have any map drawing data and the user is not
      // picking a location, they just saved creating or editing a polygon. We
      // clear the map drawing data and trigger an on change with the GeoJSON.
      setMapDrawingData(null);

      let geoJson;
      if (!value) {
        geoJson = {
          ...mapDrawingData.fillPolygon,
          properties: { provenance: GEOMETRY_PROVENANCE_WEB },
        };

        eventReportTracker.track('New event area completed');
      } else {
        const valuePolygon = value.type === 'FeatureCollection'
          ? value.features.find((feature) => feature.geometry.type === 'Polygon')
          : value;
        geoJson = {
          ...mapDrawingData.fillPolygon,
          properties: { provenance: valuePolygon?.properties?.provenance },
        };

        eventReportTracker.track('Existing event area edited');
      }

      onChange(geoJson);
    }
  }, [isPickingLocation, mapDrawingData, onChange, setMapDrawingData, value]);

  useEffect(() => {
    if (!isDrawingEventGeometry) {
      setAppToShowMapMode(false);
    }
  }, [isDrawingEventGeometry, setAppToShowMapMode]);

  return <>
    <div
        className={styles.areaPicker
          + (readOnly ? ` ${styles.readOnly}` : '')
          + (disabled ? ` ${styles.disabled}` : '')
          + (inputProps['aria-invalid'] ? ` ${styles.error}` : '')
          + ` ${className}`}
        // Since our picker is a group of buttons, we handle the blur and focus
        // from the wrapper but make sure to not call the methods if we are
        // just changing focus within the inner buttons.
        onBlur={(event) => !innerRef.current.contains(event.relatedTarget) && onBlur?.(event)}
        onFocus={(event) => !innerRef.current.contains(event.relatedTarget) && onFocus?.(event)}
        ref={innerRef}
        role="group"
        {...otherProps}
      >
      <button
        aria-controls={menuPopoverId}
        aria-expanded={isMenuPopoverOpen}
        aria-haspopup="dialog"
        aria-label={t(`setAreaButtonLabel.${!value ? 'create' : isMenuPopoverOpen ? 'open' : 'closed'}`)}
        className={`${styles.setAreaButton} ${readOnly ? styles.readOnly : ''}`}
        disabled={disabled}
        onClick={readOnly ? undefined : () => value ? setIsMenuPopoverOpen(!isMenuPopoverOpen) : onPickArea()}
        ref={setAreaButtonRef}
        title={t(`setAreaButtonLabel.${!value ? 'create' : isMenuPopoverOpen ? 'open' : 'closed'}`)}
        type="button"
      >
        <PolygonIcon aria-hidden className={styles.icon} data-testid="polygon-icon" />

        <input
          aria-describedby={inputDescriptionId}
          aria-label={t('inputLabel')}
          className={`${styles.input} ${readOnly ? styles.readOnly : ''}`}
          disabled={disabled}
          id={id}
          onFocus={() => setAreaButtonRef.current.focus()}
          placeholder={placeholder || t('defaultPlaceholder')}
          readOnly
          required={required}
          tabIndex={-1}
          type="text"
          value={value ? t('displayString', { areaDisplayString, perimeterDisplayString }) : ''}
          {...inputProps}
        />

        <p className="sr-only" id={inputDescriptionId}>
          {t('inputDescription')}
        </p>
      </button>

      {value && <TextCopyBtn
        aria-label={t('textCopyButtonLabel')}
        className={styles.textCopyButton}
        disabled={disabled}
        text={JSON.stringify(value)}
        title={t('textCopyButtonLabel')}
      />}

      <input
        data-testid="areaPicker-input"
        name={name}
        type="hidden"
        value={value ? JSON.stringify(value) : ''}
      />
    </div>

    <Overlay container={innerRef} placement="bottom-start" show={isMenuPopoverOpen} target={innerRef}>
      <MenuPopover
        event={event}
        id={menuPopoverId}
        onChange={onChange}
        onBlur={onBlur}
        onClose={() => setIsMenuPopoverOpen(false)}
        onPickArea={onPickArea}
        setAreaButtonRef={setAreaButtonRef}
        target={innerRef}
      />
    </Overlay>
  </>;
};

export default memo(AreaPicker);
