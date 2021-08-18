import React, { useContext, useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { connect } from 'react-redux';

import { calcGpsDisplayString, validateLngLat } from '../utils/location';
import styles from './styles.module.scss';

import { showPopup } from '../ducks/popup';

import { MapContext } from '../App';
import GpsFormatToggle from '../GpsFormatToggle';

const { Toggle, Menu } = Dropdown;


const CursorGpsDisplay = (props) => {
  const { gpsFormat, showPopup } = props;

  const [coords, setCoords] = useState(null);
  const map = useContext(MapContext);

  const isValidLocation = coords?.lng && coords?.lat && validateLngLat(coords.lng, coords.lat);

  useEffect(() => {
    if (map) {
      const onMouseMove = (e) => {
        setCoords(e.lngLat);
      };

      const onRightClickMap = (e) => {
        const coordinates = [e.lngLat.lng, e.lngLat.lat];

        showPopup('dropped-marker', { location: e.lngLat, coordinates, popupAttrs: {
          offset: [0, 0],
        } });
      };

      map.on('contextmenu', onRightClickMap);
      map.on('mousemove', onMouseMove);
      return () => {
        map.off('mousemove', onMouseMove);
        map.off('contextmenu', onRightClickMap);
      };
    }
  }, [map, showPopup]);

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

export default connect(mapStateToProps, { showPopup })(CursorGpsDisplay);