import React, { memo } from 'react';
import bbox from '@turf/bbox';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import rewind from '@turf/rewind';
import { useSelector } from 'react-redux';

import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';
import { ReactComponent as PolygonIcon } from '../../../common/images/icons/polygon.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { REACT_APP_MAPBOX_TOKEN } from '../../../constants';

import styles from './styles.module.scss';

const MAPBOX_MAXIMUM_LATITUDE = 85.0511;
const STATIC_MAP_WIDTH = 300;
const STATIC_MAP_HEGHT = 130;

const AreaTab = ({ onAreaSelectStart }) => {
  const event = useSelector((state) => state.view.userMapInteraction.event);

  const hasGeometry = !!event?.geometry;

  let contentRendered;
  if (hasGeometry) {
    // TODO: Set this value depending on the geojson properties
    const imageSource = 'desktop';

    const eventGeometryBbox = bbox(event.geometry);
    const minLon = eventGeometryBbox[0];
    const minLat = Math.max(-MAPBOX_MAXIMUM_LATITUDE, eventGeometryBbox[1]);
    const maxLon = eventGeometryBbox[2];
    const maxLat = Math.min(MAPBOX_MAXIMUM_LATITUDE, eventGeometryBbox[3]);

    const eventGeoJsonRightHandRule = rewind(event.geometry);

    const mapboxStaticImagesAPIURL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';
    const eventGeoJSONEncoded = `geojson(${encodeURI(JSON.stringify(eventGeoJsonRightHandRule))})`;
    const areForGeometryBBOXEncoded = `[${minLon},${minLat},${maxLon},${maxLat}]`;
    const staticImageDimensions = `${STATIC_MAP_WIDTH}x${STATIC_MAP_HEGHT}`;
    const mapboxStaticImageAPIQuery = `padding=10&access_token=${REACT_APP_MAPBOX_TOKEN}&logo=false&attribution=false`;

    const mapboxStaticImageSource = `${mapboxStaticImagesAPIURL}/${eventGeoJSONEncoded}/` +
      `${areForGeometryBBOXEncoded}/${staticImageDimensions}?${mapboxStaticImageAPIQuery}`;

    contentRendered = <>
      <div className={styles.geometryMeasurements}>
        <div>Area: 0m</div>

        <div>Perimeter: 0m</div>
      </div>

      <img alt="Static map with geometry" src={mapboxStaticImageSource} />

      <label className={styles.imageSource}>Created on {imageSource}</label>

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
          onClick={() => {}} // TODO: implement once drawing mechanism is ready
          title="Delete area button"
          type="button"
        >
          <TrashCanIcon />
          Delete Area
        </Button>
      </div>
    </>;
  } else {
    contentRendered = <Button
      className={styles.createAreaButton}
      onClick={onAreaSelectStart}
      title="Place geometry on map"
      type="button"
      >
      <PolygonIcon />
      Create report area
    </Button>;
  }

  return <div className={styles.locationAreaContent}>{contentRendered}</div>;
};

AreaTab.propTypes = { onAreaSelectStart: PropTypes.func.isRequired };

export default memo(AreaTab);
