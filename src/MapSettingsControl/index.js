import React, { useRef } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import MapLockControl from '../MapLockControl';
import MapNamesControl from '../MapNamesControl';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import styles from './styles.module.scss';

import { withMap } from '../EarthRangerMap';

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

  return <OverlayTrigger trigger="click" placement="top" rootClose={true} overlay={popover}>
    <div className={styles.gearButton}><button ref={formRef}><GearIcon /></button></div>
  </OverlayTrigger>;
};

export default withMap(MapSettingsControl);
