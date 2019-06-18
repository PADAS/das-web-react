import React, { useRef } from 'react';
import { OverlayTrigger, Button } from 'react-bootstrap';
import MapLockControl from '../MapLockControl';
import MapNamesControl from '../MapNamesControl';
import styles from './styles.module.scss';

const MapSettingsPanel = (props) => {
  const { map } = props;

  return <div className={styles.settingsOverlay}>
      <ul>
        <li key='maplock'><MapLockControl map={map} /></li>
        <li key='mapname'><MapNamesControl /></li>
      </ul>
    </div>;
};

const MapSettingsControl = (props) => {
  const { map } = props;
  const formRef = useRef(null);

  return <OverlayTrigger
    placement="right"
    overlay={
      <MapSettingsPanel map={map} />
    }
    target={formRef.current}
    trigger="click" >
    <div>
    <button className={styles.gearButton} ref={formRef}> </button>
    </div>
  </OverlayTrigger>;
};

export default MapSettingsControl;
