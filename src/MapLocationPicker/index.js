import React, { memo, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { setPickingMapLocationState } from '../ducks/map-ui';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const bindExternal = function (map, eventType, toInvoke) {
  map.on(eventType, toInvoke);
  return toInvoke;
};

const unbindExternal = (map, eventType, func) => {
  map.off(eventType, func);
};

const MapLocationPicker = (props) => {
  const { label, map, onLocationSelect, onLocationSelectCancel, onLocationSelectStart, setPickingMapLocationState } = props;

  const clickFunc = useRef(null);
  const keydownFunc = useRef((event) => {
    event.preventDefault();
    event.stopPropagation();
    setPickingMapLocationState(false);
    unbindMapEvents();
    onLocationSelectCancel();
  });

  const bindMapEvents = () => {
    clickFunc.current = bindExternal(map, 'click', onSelect);
    document.addEventListener('keydown', keydownFunc.current);
  };


  const unbindMapEvents = () => {
    unbindExternal(map, 'click', clickFunc.current);
    document.removeEventListener('keydown', keydownFunc.current);
  };

/*   useEffect(() => {
    return () => {
      setPickingMapLocationState(false);
      unbindMapEvents();
    };
  }, []); */

  const onSelect = (e) => {
    setPickingMapLocationState(false);
    unbindMapEvents();
    onLocationSelect(e);
  };

  const onSelectStart = () => {
    setPickingMapLocationState(true);
    bindMapEvents();
    onLocationSelectStart();
  };

  return <a href="#" onClick={onSelectStart}><span className={styles.icon}></span>{label}</a>;
};

export default connect(null, { setPickingMapLocationState })(memo(MapLocationPicker));

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
