import React, { memo, useMemo } from 'react';
import bbox from '@turf/bbox';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import rewind from '@turf/rewind';
import simplify from '@turf/simplify';
import { useSelector } from 'react-redux';

import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { REACT_APP_MAPBOX_TOKEN } from '../../../constants';
import { useEventGeoMeasurementDisplayStrings } from '../../../hooks/geometry';

import styles from './styles.module.scss';

const MAPBOX_MAXIMUM_LATITUDE = 85.0511;
const STATIC_MAP_WIDTH = 296;
const STATIC_MAP_HEGHT = 130;

const GeometryPreview = ({ event, onAreaSelectStart, onDeleteArea }) => {
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

  const mapboxStaticImagesAPIURL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';
  const eventGeoJSONEncoded = `geojson(${encodeURI(JSON.stringify(simplified))})`;
  const areForGeometryBBOXEncoded = `[${minLon},${minLat},${maxLon},${maxLat}]`;
  const staticImageDimensions = `${STATIC_MAP_WIDTH}x${STATIC_MAP_HEGHT}`;
  const mapboxStaticImageAPIQuery = `padding=10&access_token=${REACT_APP_MAPBOX_TOKEN}&logo=false&attribution=false`;

  const mapboxStaticImageSource = `${mapboxStaticImagesAPIURL}/${eventGeoJSONEncoded}/` +
    `${areForGeometryBBOXEncoded}/${staticImageDimensions}?${mapboxStaticImageAPIQuery}`;

  const [perimeterDisplayString, areaDisplayString] = useEventGeoMeasurementDisplayStrings(event, originalEvent);

  const provenanceLabel = useMemo(() => {
    const provenance = eventPolygon?.properties?.provenance;
    if (!provenance) {
      return null;
    }
    return `Created on EarthRanger ${provenance}`;
  }, [eventPolygon?.properties?.provenance]);

  return <div className={styles.locationAreaContent}>
    <div className={styles.geometryMeasurements}>
      <div>Area: <span className={styles.measureValue}>{areaDisplayString}</span></div>

      <div>Perimeter: <span className={styles.measureValue}>{perimeterDisplayString}</span></div>
    </div>

    <img alt="Static map with geometry" src={mapboxStaticImageSource} />

    {!!provenanceLabel && <label className={styles.imageSource}>{provenanceLabel}</label>}

    <div className={styles.geometryEditButtons}>
      <Button
        className={styles.editAreaButton}
        onClick={onAreaSelectStart}
        title="Place geometry on map"
        type="button"
      >
        <PencilIcon />
        Edit Area
      </Button>

      <Button
        className={styles.deleteAreaButton}
        onClick={onDeleteArea}
        title="Delete area button"
        type="button"
      >
        <TrashCanIcon />
        Delete Area
      </Button>
    </div>
  </div>;
};

GeometryPreview.propTypes = {
  event: PropTypes.object.isRequired,
  onAreaSelectStart: PropTypes.func.isRequired,
  onDeleteArea: PropTypes.func.isRequired,
};

export default memo(GeometryPreview);
