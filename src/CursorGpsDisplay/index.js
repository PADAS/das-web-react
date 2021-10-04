import React, { useContext, useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { connect } from 'react-redux';

import { calcGpsDisplayString, validateLngLat } from '../utils/location';
import styles from './styles.module.scss';

import { MapContext } from '../App';
import GpsFormatToggle from '../GpsFormatToggle';

const { Toggle, Menu } = Dropdown;


const CursorGpsDisplay = (props) => {
  const { gpsFormat } = props;

  const [coords, setCoords] = useState(null);
  const map = useContext(MapContext);

  const isValidLocation = coords?.lng && coords?.lat && validateLngLat(coords.lng, coords.lat);

  useEffect(() => {
    if (map) {
      const onMouseMove = (e) => {
        setCoords(e.lngLat);
      };

      map.on('mousemove', onMouseMove);
      return () => {
        map.off('mousemove', onMouseMove);
      };
    }
  }, [map]);

  if (!isValidLocation) return null;

  return <Dropdown alignRight>
    <Toggle className={styles.container}>
      {isValidLocation && calcGpsDisplayString(coords.lat, coords.lng, gpsFormat)}
    </Toggle>
    <Menu className={styles.menu}>
      <GpsFormatToggle className={styles.gpsFormatSelect} showGpsString={false} />
    </Menu>
  </Dropdown>;
};

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }) => ({ gpsFormat });

export default connect(mapStateToProps, null)(CursorGpsDisplay);