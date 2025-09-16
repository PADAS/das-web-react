import React, { useContext, useEffect, useRef } from 'react';
import { bbox, rewind, simplify } from '@turf/turf';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilIcon } from '../../../../common/images/icons/pencil.svg';
import { ReactComponent as TrashCanIcon } from '../../../../common/images/icons/trash-can.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../../../utils/analytics';
import { MapDrawingToolsContext } from '../../../../MapDrawingTools/ContextProvider';
import { REACT_APP_MAPBOX_TOKEN } from '../../../../constants';
import { useEventGeoMeasurementDisplayStrings } from '../../../../hooks/geometry';

import * as styles from './styles.module.scss';

// TODO: This is a common component and its events shouldn't be linked to the event report track category.
const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const MAPBOX_STATIC_IMAGES_API_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';

const MAPBOX_MAXIMUM_LATITUDE = 85.0511;

const MAX_POPOVER_WIDTH = 380;
const MIN_POPOVER_WIDTH = 280;

const STATIC_MAP_WIDTH = 296;
const STATIC_MAP_HEGHT = 130;

export const GeometryPreview = ({ event, ...otherProps }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.areaPicker.menuPopover' });

  const originalEvent = useSelector((state) => state.data.eventStore[event.id]);

  const eventPolygon = event.geometry.type === 'FeatureCollection'
    ? event.geometry.features.find((feature) => feature.geometry.type === 'Polygon')
    : event.geometry;

  const eventGeometryBbox = bbox(eventPolygon);
  const minLon = eventGeometryBbox[0];
  const minLat = Math.max(-MAPBOX_MAXIMUM_LATITUDE, eventGeometryBbox[1]);
  const maxLon = eventGeometryBbox[2];
  const maxLat = Math.min(MAPBOX_MAXIMUM_LATITUDE, eventGeometryBbox[3]);

  const eventGeoJsonRightHandRule = rewind(eventPolygon);

  const simplified = simplify(eventGeoJsonRightHandRule, { tolerance: .0001 });

  const eventGeoJSONEncoded = `geojson(${encodeURI(JSON.stringify(simplified))})`;
  const areForGeometryBBOXEncoded = `[${minLon},${minLat},${maxLon},${maxLat}]`;
  const staticImageDimensions = `${STATIC_MAP_WIDTH}x${STATIC_MAP_HEGHT}`;
  const mapboxStaticImageAPIQuery = `padding=15&access_token=${REACT_APP_MAPBOX_TOKEN}&logo=false&attribution=false`;

  const mapboxStaticImageSource = `${MAPBOX_STATIC_IMAGES_API_URL}/${eventGeoJSONEncoded}/` +
    `${areForGeometryBBOXEncoded}/${staticImageDimensions}?${mapboxStaticImageAPIQuery}`;

  const [perimeterDisplayString, areaDisplayString] = useEventGeoMeasurementDisplayStrings(event, originalEvent);

  const provenance = eventPolygon?.properties?.provenance
    ? t('provenanceLabel', { provenance: eventPolygon.properties.provenance })
    : null;

  return <div {...otherProps}>
    <div className={styles.geometryMeasurements}>
      <div>
        {t('area')}

        <span className={styles.measureValue}>{areaDisplayString}</span>
      </div>

      <div>
        {t('perimeter')}

        <span className={styles.measureValue}>{perimeterDisplayString}</span>
      </div>
    </div>

    <div className={styles.imageWrapper}>
      <img alt={t('staticMapImageAlt')} className={styles.areaImage} src={mapboxStaticImageSource} />

      {!!provenance && <span className={styles.imageSource}>{provenance}</span>}
    </div>
  </div>;
};

const MenuPopover = ({
  className,
  event,
  onBlur,
  onChange,
  onClose,
  onPickArea,
  ref,
  setAreaButtonRef,
  style,
  target,
  ...otherProps
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.areaPicker.menuPopover' });

  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);

  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const deleteAreaButtonRef = useRef();
  const editAreaButtonRef = useRef();
  // Set the popover width equal to the area picker's width if it's between the
  // min and max boundaries and store it in a ref so it doesn't change.
  const popoverWidthRef = useRef(
    Math.min(MAX_POPOVER_WIDTH, Math.max(MIN_POPOVER_WIDTH, target.current?.offsetWidth))
  );
  const wrapperRef = useRef();

  const onWrapperKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      onClose();

      setAreaButtonRef.current.focus();
    }
  };

  const onDeleteAreaButtonClick = (event) => {
    event.preventDefault();

    setMapDrawingData(null);
    onChange(null);
    onClose();

    eventReportTracker.track('Area deleted');
  };

  useEffect(() => {
    // Focus the edit area button on mount.
    editAreaButtonRef.current.focus();
  }, []);

  useEffect(() => {
    // Create a focus trap while the component is mounted so only internal
    // elements are focused when pressing tab only if the user is not drawing
    // an area in the map.
    if (!isPickingLocation) {
      const onKeyDown = (event) => {
        if (event.key === 'Tab') {
          if (event.shiftKey && document.activeElement === editAreaButtonRef.current) {
            event.preventDefault();

            deleteAreaButtonRef.current.focus();
          } else if (!event.shiftKey && document.activeElement === deleteAreaButtonRef.current) {
            event.preventDefault();

            editAreaButtonRef.current.focus();
          }
        }
      };

      document.addEventListener('keydown', onKeyDown);

      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [isPickingLocation]);

  useEffect(() => {
    // Add a pointer down event to close the menu if the user clicks outside
    // only if the user is not drawing an area in the map.
    if (!isPickingLocation) {
      const onPointerDown = (event) => {
        if (!wrapperRef.current.contains(event.target) && !setAreaButtonRef.current.contains(event.target)) {
          onClose(event);

          if (onBlur && !target.current.contains(event.target)) {
            // Clicking away from our picker when the menu is open doesn't
            // trigger the wrapper's blur event, so we need to trigger the
            // onBlur callback manually.
            const blurEvent = new FocusEvent('blur', {
              bubbles: true,
              cancelable: false,
              relatedTarget: event.target,
            });

            Object.defineProperties(blurEvent, {
              target: {
                value: target.current,
              },
            });

            onBlur(blurEvent);
          }
        }
      };

      document.addEventListener('pointerdown', onPointerDown);

      return () => document.removeEventListener('pointerdown', onPointerDown);
    }
  }, [isPickingLocation, onBlur, onClose, setAreaButtonRef, target]);

  return <Popover
      aria-label={t('dialogLabel')}
      className={`${className} ${styles.menuPopover}`}
      ref={ref}
      role="dialog"
      style={{ ...style, minWidth: popoverWidthRef.current, width: popoverWidthRef.current }}
      {...otherProps}
    >
    <div className={styles.wrapper} onKeyDown={isPickingLocation ? undefined : onWrapperKeyDown} ref={wrapperRef}>
      {event.geometry && <>
        <GeometryPreview event={event} />

        <div className={styles.buttons}>
          <button
            aria-label={t('editAreaButtonLabel')}
            onClick={onPickArea}
            ref={editAreaButtonRef}
            title={t('editAreaButtonLabel')}
            type="button"
          >
            <PencilIcon />

            {t('editAreaButton')}
          </button>

          <button
            className={styles.deleteAreaButton}
            onClick={onDeleteAreaButtonClick}
            ref={deleteAreaButtonRef}
            type="button"
          >
            <TrashCanIcon />

            {t('deleteAreaButton')}
          </button>
        </div>
      </>}
    </div>
  </Popover>;
};

export default MenuPopover;
