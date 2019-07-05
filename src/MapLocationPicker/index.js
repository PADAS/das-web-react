import React, { memo, useRef } from 'react';
import { connect } from 'react-redux';
import { setPickingMapLocationState } from '../ducks/map-ui';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

const bindExternal = function (map, eventType, toInvoke) {
  map.on(eventType, toInvoke);
  return toInvoke;
};

const unbindExternal = (map, eventType, func) => {
  map.off(eventType, func);
};

const MapLocationPicker = (props) => {
  const { className, label, map, onLocationSelect, onLocationSelectCancel, onLocationSelectStart, setPickingMapLocationState } = props;

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

  return <button style={{position: 'relative', zIndex: 6}} id="picky" className={className} onClick={onSelectStart}>
    <LocationIcon />
    <span>{label}</span>
  </button>;
};

export default connect(null, { setPickingMapLocationState })(withMap(MapLocationPicker));

MapLocationPicker.defaultProps = {
  className: '',
  onLocationSelectStart() {

  },
  onLocationSelectCancel() {

  },
  label: 'Choose on map',
};

MapLocationPicker.propTypes = {
  className: PropTypes.string,
  onLocationSelectStart: PropTypes.func,
  onLocationSelect: PropTypes.func.isRequired,
  map: PropTypes.object.isRequired,
  label: PropTypes.string,
};
