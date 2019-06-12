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
  const { label, map, onLocationSelectStart, onLocationSelect } = props;

  const clickFunc = useRef(null);

  useEffect(() => {
    return () => {
      unbindExternal(map, 'click', clickFunc.current);
      map.getCanvas().style.cursor = '';
    };
  }, []);

  const onSelect = (e) => {
    const { originalEvent } = e;
    originalEvent.stopPropagation();
    originalEvent.preventDefault();

    map.getCanvas().style.cursor = '';

    onLocationSelect(e);
    unbindExternal(map, 'click', clickFunc.current);
  };

  const onSelectStart = () => {
    onLocationSelectStart();
    map.getCanvas().style.cursor = 'crosshair';
    clickFunc.current = bindExternal(map, 'click', onSelect);
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
