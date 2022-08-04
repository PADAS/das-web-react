import React, { memo } from 'react';
import PropTypes from 'prop-types';
import bbox from '@turf/bbox';
import Button from 'react-bootstrap/Button';

import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';
import { ReactComponent as PolygonIcon } from '../../../common/images/icons/polygon.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { REACT_APP_MAPBOX_TOKEN } from '../../../constants';

import MapAreaPicker from '../../../MapAreaPicker';

import styles from './styles.module.scss';

const MAPBOX_MAXIMUM_LATITUDE = 85.0511;
const STATIC_MAP_WIDTH = 300;
const STATIC_MAP_HEGHT = 130;

const AreaTab = ({ areaFor, onAreaSelectCancel, onAreaSelectStart }) => {
  const hasGeometry = !!areaFor.geometry;

  let contentRendered;
  if (hasGeometry) {
    // TODO: Set this value depending on the geojson properties
    const imageSource = 'desktop';

    const areaForGeometryBbox = bbox(areaFor.geometry);
    const minLon = areaForGeometryBbox[1];
    const minLat = Math.max(-MAPBOX_MAXIMUM_LATITUDE, areaForGeometryBbox[0]);
    const maxLon = areaForGeometryBbox[3];
    const maxLat = Math.min(MAPBOX_MAXIMUM_LATITUDE, areaForGeometryBbox[2]);

    const mapboxStaticImagesAPIURL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';
    const areaForGeoJSONEncoded = `geojson(${encodeURI(JSON.stringify(areaFor.geometry))})`;
    const areForGeometryBBOXEncoded = `[${minLon},${minLat},${maxLon},${maxLat}]`;
    const staticImageDimensions = `${STATIC_MAP_WIDTH}x${STATIC_MAP_HEGHT}`;
    const mapboxStaticImageAPIQuery = `access_token=${REACT_APP_MAPBOX_TOKEN}&logo=false&attribution=false`;

    const mapboxStaticImageSource = `${mapboxStaticImagesAPIURL}/${areaForGeoJSONEncoded}/` +
      `${areForGeometryBBOXEncoded}/${staticImageDimensions}?${mapboxStaticImageAPIQuery}`;

    contentRendered = <>
      <div className={styles.geometryMeasurements}>
        <div>Area: 0m</div>

        <div>Perimeter: 0m</div>
      </div>

      <img alt="Static map with geometry" src={mapboxStaticImageSource} />

      <label className={styles.imageSource}>Created on {imageSource}</label>

      <div className={styles.geometryEditButtons}>
        <MapAreaPicker
          className={styles.editAreaButton}
          areaFor={areaFor}
          onAreaSelectCancel={onAreaSelectCancel}
          onAreaSelectStart={onAreaSelectStart}
        >
          <PencilIcon />
          Edit Area
        </MapAreaPicker>

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
    contentRendered = <MapAreaPicker
      className={styles.createAreaButton}
      areaFor={areaFor}
      onAreaSelectCancel={onAreaSelectCancel}
      onAreaSelectStart={onAreaSelectStart}
      >
      <PolygonIcon />
      Create report area
    </MapAreaPicker>;
  }

  return <div className={styles.locationAreaContent}>{contentRendered}</div>;
};

AreaTab.propTypes = {
  areaFor: PropTypes.object.isRequired,
  onAreaSelectCancel: PropTypes.func.isRequired,
  onAreaSelectStart: PropTypes.func.isRequired,
};

export default memo(AreaTab);
