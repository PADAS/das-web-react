import React, { memo, useMemo } from 'react';
import bbox from '@turf/bbox';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import rewind from '@turf/rewind';
import simplify from '@turf/simplify';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilIcon } from '../../../../common/images/icons/pencil.svg';
import { ReactComponent as TrashCanIcon } from '../../../../common/images/icons/trash-can.svg';

import { REACT_APP_MAPBOX_TOKEN } from '../../../../constants';
import { useEventGeoMeasurementDisplayStrings } from '../../../../hooks/geometry';

import styles from './styles.module.scss';

const MAPBOX_STATIC_IMAGES_API_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';

const MAPBOX_MAXIMUM_LATITUDE = 85.0511;
const STATIC_MAP_WIDTH = 296;
const STATIC_MAP_HEGHT = 130;

const GeometryPreview = ({ className, event, onAreaSelectStart, onDeleteArea }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager' });

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
  const mapboxStaticImageAPIQuery = `padding=10&access_token=${REACT_APP_MAPBOX_TOKEN}&logo=false&attribution=false`;

  const mapboxStaticImageSource = `${MAPBOX_STATIC_IMAGES_API_URL}/${eventGeoJSONEncoded}/` +
    `${areForGeometryBBOXEncoded}/${staticImageDimensions}?${mapboxStaticImageAPIQuery}`;

  const [perimeterDisplayString, areaDisplayString] = useEventGeoMeasurementDisplayStrings(event, originalEvent);

  const provenanceLabel = useMemo(() => {
    const provenance = eventPolygon?.properties?.provenance;
    if (!provenance) {
      return null;
    }
    return t('detailsSection.areaSelectorInput.provenanceLabel', { provenance });
  }, [eventPolygon?.properties?.provenance, t]);

  return <div className={`${styles.locationAreaContent} ${className}`}>
    <div className={styles.geometryMeasurements}>
      <div>
        {t('detailsSection.areaSelectorInput.area')}

        <span className={styles.measureValue}>{areaDisplayString}</span>
      </div>

      <div>
        {t('detailsSection.areaSelectorInput.perimeter')}

        <span className={styles.measureValue}>{perimeterDisplayString}</span>
      </div>
    </div>

    <img alt={t('detailsSection.areaSelectorInput.staticMapImageAlt')} src={mapboxStaticImageSource} />

    {!!provenanceLabel && <label className={styles.imageSource}>{provenanceLabel}</label>}

    <div className={styles.geometryEditButtons}>
      {onAreaSelectStart && <Button
        className={styles.editAreaButton}
        onClick={onAreaSelectStart}
        title={t('detailsSection.areaSelectorInput.editAreaButtonTitle')}
        type="button"
      >
        <PencilIcon />
        {t('detailsSection.areaSelectorInput.editAreaButton')}
      </Button>}

      {onDeleteArea && <Button
        className={styles.deleteAreaButton}
        onClick={onDeleteArea}
        title={t('detailsSection.areaSelectorInput.deleteAreaButtonTitle')}
        type="button"
      >
        <TrashCanIcon />
        {t('detailsSection.areaSelectorInput.deleteAreaButton')}
      </Button>}
    </div>
  </div>;
};

GeometryPreview.defaultProps = {
  className: '',
  onAreaSelectStart: null,
  onDeleteArea: null,
};

GeometryPreview.propTypes = {
  className: PropTypes.string,
  event: PropTypes.object.isRequired,
  onAreaSelectStart: PropTypes.func,
  onDeleteArea: PropTypes.func,
};

export default memo(GeometryPreview);
