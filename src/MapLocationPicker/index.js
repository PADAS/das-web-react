import React, { memo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIsPickingLocation } from '../ducks/map-ui';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import { withMap } from '../EarthRangerMap';
import Popup from '../Popup';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

import styles from './styles.module.scss';

const bindExternal = function (map, eventType, toInvoke) {
  map.on(eventType, toInvoke);
  return toInvoke;
};

const unbindExternal = (map, eventType, func) => {
  map.off(eventType, func);
};

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapLocationPicker = (props) => {
  const { className, disabled, label, map, onLocationSelect, onLocationSelectCancel, onLocationSelectStart, showCancelButton, wrapperClassName } = props;

  const dispatch = useDispatch();
  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);

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
    dispatch(setIsPickingLocation(false));
    unbindMapEvents();
    onLocationSelectCancel();
    mapInteractionTracker.track('Dismiss \'Drop Marker\'');
  };

  const onSelect = (e) => {
    dispatch(setIsPickingLocation(false));
    unbindMapEvents();
    onLocationSelect(e);
    mapInteractionTracker.track('Place \'Drop Marker\' to Create Report');
  };

  const onSelectStart = () => {
    dispatch(setIsPickingLocation(true));
    bindMapEvents();
    onLocationSelectStart();
    mapInteractionTracker.track('Click \'Drop Marker\' button');
  };

  return  <>
    <div className={wrapperClassName}>
      {showCancelButton && <Button variant='dark' size='sm' id='cancel-location-select' onClick={onCancel} type='button'>Cancel</Button>}
      <button
      disabled={disabled}
      type='button'
      className={`${className} controlButton`}
      onClick={onSelectStart}
      title='Place marker on map'
    >
        <LocationIcon />
        <span>{label}</span>
      </button>
    </div>
    {isPickingLocation &&
      <Popup
            map={map}
            className={styles.popup}
            offset={[-8, 0]}
            anchor="left"
            trackPointer={true}
        >
        <p>Click to select a location</p>
      </Popup>
    }
  </>;
};

export default withMap(memo(MapLocationPicker));

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
