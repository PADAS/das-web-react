import React, { memo, useRef } from 'react';
import { connect } from 'react-redux';
import { setPickingMapLocationState } from '../ducks/map-ui';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { trackEvent } from '../utils/analytics';

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
  const { className, disabled, label, map, onLocationSelect, onLocationSelectCancel, onLocationSelectStart, setPickingMapLocationState, showCancelButton, wrapperClassName } = props;

  const clickFunc = useRef(null);
  const keydownFunc = useRef((event) => {
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  });

  const bindMapEvents = () => {
    clickFunc.current = bindExternal(map, 'click', onSelect);
    document.addEventListener('keydown', keydownFunc.current);
  };


  const unbindMapEvents = () => {
    unbindExternal(map, 'click', clickFunc.current);
    document.removeEventListener('keydown', keydownFunc.current);
  };

  const onCancel = (e) => {
    setPickingMapLocationState(false);
    unbindMapEvents();
    onLocationSelectCancel();
    trackEvent('Map Interaction', "Dismiss 'Drop Marker'");
  };

  const onSelect = (e) => {
    setPickingMapLocationState(false);
    unbindMapEvents();
    onLocationSelect(e);
    trackEvent('Map Interaction', "Place 'Drop Marker' to Create Report");
  };

  const onSelectStart = () => {
    setPickingMapLocationState(true);
    bindMapEvents();
    onLocationSelectStart();
    trackEvent('Map Interaction', "Click 'Drop Marker' button");
  };

  return <div className={wrapperClassName}>
    <button disabled={disabled} type='button' className={className} onClick={onSelectStart}>
      <LocationIcon />
      <span>{label}</span>
    </button>
    {showCancelButton && <Button variant='dark' size='sm' id='cancel-location-select' onClick={onCancel} type='button'>Cancel</Button>}
  </div>;
};

export default connect(null, { setPickingMapLocationState })(withMap(memo(MapLocationPicker)));

MapLocationPicker.defaultProps = {
  className: '',
  onLocationSelectStart() {

  },
  onLocationSelectCancel() {

  },
  label: 'Choose on map',
  disabled: false,
  showCancelButton: false,
  wrapperClassName: '',
};

MapLocationPicker.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onLocationSelectStart: PropTypes.func,
  onLocationSelect: PropTypes.func.isRequired,
  map: PropTypes.object.isRequired,
  label: PropTypes.string,
  showCancelButton: PropTypes.bool,
  wrapperClassName: PropTypes.string,
};
