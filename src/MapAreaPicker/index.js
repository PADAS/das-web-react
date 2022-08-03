// import React, { memo, useCallback, useContext, useEffect, useRef } from 'react';
import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

// import { MapContext } from '../App';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { setPickingMapAreaState } from '../ducks/map-ui';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapAreaPicker = ({
  areaFor,
  // onAreaSelect: onAreaSelectCallback,
  onAreaSelectCancel: onAreaSelectCancelCallback,
  onAreaSelectStart: onAreaSelectStartCallback,
  ...rest
}) => {
  const dispatch = useDispatch();

  // TODO: this code is the same than MapLocationPicker (refactored) but we should instead
  // follow the implementation of MapRulerControl to draw an area

  // const map = useContext(MapContext);

  // const onClickMapRef = useRef();
  // const onKeydownRef = useRef();

  // const bindEvents = useCallback(() => {
  //   map.on('click', onClickMapRef.current);
  //   document.addEventListener('keydown', onKeydownRef.current);
  // }, [map]);

  // const unbindEvents = useCallback(() => {
  //   map.off('click', onClickMapRef.current);
  //   document.removeEventListener('keydown', onKeydownRef.current);
  // }, [map]);

  // const onAreaSelectCancel = useCallback(() => {
  //   unbindEvents();
  //   onAreaSelectCancelCallback();

  //   dispatch(setPickingMapLocationState(false));

  //   mapInteractionTracker.track('Geometry cancelled');
  // }, [dispatch, onAreaSelectCancelCallback, unbindEvents]);

  // const onAreaSelect = useCallback((e) => {
  //   unbindEvents();
  //   onAreaSelectCallback(e);

  //   dispatch(setPickingMapLocationState(false));

  //   mapInteractionTracker.track('Geometry selected on map');
  // }, [dispatch, onAreaSelectCallback, unbindEvents]);

  // const onAreaSelectStart = useCallback(() => {
  //   bindEvents();
  //   onAreaSelectStartCallback();

  //   dispatch(setPickingMapLocationState(true));

  //   mapInteractionTracker.track('Geometry selection on map started');
  // }, [bindEvents, dispatch, onAreaSelectStartCallback]);

  // useEffect(() => {
  //   onClickMapRef.current = (event) => {
  //     event.preventDefault();
  //     event.stopPropagation();

  //     onAreaSelect();
  //   };
  // }, [onAreaSelect]);

  // useEffect(() => {
  //   onKeydownRef.current = (event) => {
  //     event.preventDefault();
  //     event.stopPropagation();

  //     onAreaSelectCancel();
  //   };
  // }, [onAreaSelectCancel]);

  const onAreaSelectStart = useCallback(() => {
    onAreaSelectStartCallback?.();

    dispatch(setPickingMapAreaState(true, areaFor));

    // setTimeout(() => {
    //   onAreaSelectCancelCallback?.();

    //   dispatch(setPickingMapAreaState(false));
    // }, 5000);

    mapInteractionTracker.track('Geometry selection on map started');
  }, [areaFor, dispatch, onAreaSelectStartCallback]);

  return <Button
    onClick={onAreaSelectStart}
    title="Place geometry on map"
    type="button"
    {...rest}
  />;
};

MapAreaPicker.defaultProps = {
  areaFor: null,
  onAreaSelectCancel: null,
  onAreaSelectStart: null,
};

MapAreaPicker.propTypes = {
  areaFor: PropTypes.object,
  onAreaSelectCancel: PropTypes.func,
  onAreaSelectStart: PropTypes.func,
};

export default memo(MapAreaPicker);
