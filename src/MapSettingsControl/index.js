import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { OverlayTrigger, Button } from 'react-bootstrap';
import styles from './styles.module.scss';

const MapSettingsPanel = (props) => (
  // <div {...props} className={styles.settingsOverly}>
  //   <h3>Our map settings panel</h3>
  // </div>
  <div {...props} className={styles.settingsOverlay}>
    Settings Panel
  </div>
);

const MapSettingsControl = () => (
  <OverlayTrigger
    placement="right"
    overlay={MapSettingsPanel}
    trigger="click"
  >
    <button className={styles.gearButton} />
  </OverlayTrigger>
);

export default MapSettingsControl;
