import React, { memo, useRef } from 'react';
import { connect } from 'react-redux';
import { setPickingMapLocationState } from '../ducks/map-ui';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import { withMap } from '../EarthRangerMap';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

const bindExternal = function (map, eventType, toInvoke) {
  map.on(eventType, toInvoke);
  return toInvoke;
};

const unbindExternal = (map, eventType, func) => {
  map.off(eventType, func);
};

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

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

  const onCancel = () => {
    setPickingMapLocationState(false);
    unbindMapEvents();
    onLocationSelectCancel();
    mapInteractionTracker.track('Dismiss \'Drop Marker\'');
  };

  const onSelect = (e) => {
    setPickingMapLocationState(false);
    unbindMapEvents();
    onLocationSelect(e);
    mapInteractionTracker.track('Place \'Drop Marker\' to Create Report');
  };

  const onSelectStart = () => {
    setPickingMapLocationState(true);
    bindMapEvents();
    onLocationSelectStart();
    mapInteractionTracker.track('Click \'Drop Marker\' button');
  };

  return <div className={wrapperClassName}>
    <button disabled={disabled} type='button' className={className} onClick={onSelectStart} title='Place marker on map'>
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
