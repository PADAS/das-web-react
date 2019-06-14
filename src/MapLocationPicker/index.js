import React, { memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const bindExternal = function (map, eventType, toInvoke) {
  map.on(eventType, toInvoke);
  return toInvoke;
};

const unbindExternal = (map, eventType, func) => {
  map.off(eventType, func);
};

const MapLocationPicker = memo((props) => {
  const { label, map, onLocationSelect, onLocationSelectCancel, onLocationSelectStart  } = props;

  const clickFunc = useRef(null);
  const keydownFunc = useRef((event) => {
    const { key } = event;
    event.preventDefault();
    event.stopPropagation();
    unbindMapEvents();
    onLocationSelectCancel();
  });

  const bindMapEvents = () => {
    map.getCanvas().style.cursor = 'crosshair';
    clickFunc.current = bindExternal(map, 'click', onSelect);
    document.addEventListener('keydown', keydownFunc.current);
  };


  const unbindMapEvents = () => {
    map.getCanvas().style.cursor = '';
    unbindExternal(map, 'click', clickFunc.current);
    document.removeEventListener('keydown', keydownFunc.current);
  };

  useEffect(() => {
    return unbindMapEvents;
  }, []);

  const onSelect = (e) => {
    const { originalEvent } = e;

    e.preventDefault();
    originalEvent.stopPropagation();
    originalEvent.preventDefault();

    unbindMapEvents();


    onLocationSelect(e);
  };

  const handleKeyDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const { key } = event;
    if (key === 'Escape') {
      unbindMapEvents();
      onLocationSelectCancel();
    }
  };

  const onSelectStart = () => {
    bindMapEvents();
    onLocationSelectStart();
  };

  return <a href="#" onClick={onSelectStart}><span className={styles.icon}></span>{label}</a>;
});

export default MapLocationPicker;

MapLocationPicker.defaultProps = {
  onLocationSelectStart() {

  },
  label: 'Choose on map',
};

MapLocationPicker.propTypes = {
  onLocationSelectStart: PropTypes.func,
  onLocationSelect: PropTypes.func.isRequired,
  map: PropTypes.object.isRequired,
  label: PropTypes.string,
};
