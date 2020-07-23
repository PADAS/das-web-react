import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';
import { Popup } from 'react-mapbox-gl';

import { hidePopup } from '../ducks/popup';
import { calcUrlForImage } from '../utils/img';
import { LAYER_IDS } from '../constants';

import styles from './styles.module.scss';

const { EVENT_SYMBOLS } = LAYER_IDS;

const LayerSelectorPopup = ({ id, data, hidePopup }) => {
  const { layers, onSelectSubject, onSelectEvent, coordinates } = data;

  const handleClick = useCallback(({ layer: { id:layerID }, properties, geometry }) => {
    const layerData = { geometry, properties };
    const layerType = layerID.includes(EVENT_SYMBOLS) ? 'event' : 'subject';
    const handler = layerType === 'event' ? onSelectEvent : onSelectSubject;

    hidePopup(id);
    handler({ layer: layerData });

  }, [hidePopup, id, onSelectEvent, onSelectSubject]);

  return <Popup className={styles.popup} coordinates={coordinates} id='multi-select-popup'>
    <h5>{layers.length} items at this point</h5>
    <ul className={styles.list}>
      {layers.map(layer => <li className={styles.listItem} key={layer.properties.id} onClick={() => handleClick(layer)}>
        <img alt={layer.properties.display_title || layer.properties.name} src={calcUrlForImage(layer.properties.image)} />
        <span>{layer.properties.display_title || layer.properties.name}</span>
      </li>)}
    </ul>
  </Popup>;
};

export default connect(null, { hidePopup })(memo(LayerSelectorPopup));
