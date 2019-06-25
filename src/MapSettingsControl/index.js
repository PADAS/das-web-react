import React, { useRef } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import MapLockControl from '../MapLockControl';
import MapNamesControl from '../MapNamesControl';
import styles from './styles.module.scss';

const MapSettingsControl = (props) => {
  const { map } = props;
  const formRef = useRef(null);

  const popover = (
    <Popover id="settings-popover" className={styles.mapSettings} title="Map Settings">
      <ul>
        <li><MapLockControl map={map} /></li>
        <li><MapNamesControl /></li>
      </ul>
    </Popover>
  );

  return <OverlayTrigger trigger="click" placement="top" overlay={popover}>
      <button className={styles.gearButton} ref={formRef}> </button>
    </OverlayTrigger>;
};

export default MapSettingsControl;
