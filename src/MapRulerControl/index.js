import React, { memo, useState, useEffect, useRef, Fragment } from 'react';
import Button from 'react-bootstrap/Button';

import { withMap } from '../EarthRangerMap';
import MapRulerLayer from '../MapRulerLayer';
import { ReactComponent as RulerIcon } from '../common/images/icons/ruler-icon.svg';
import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

const MapRulerControl = (props) => {
  const { map } = props;
  const [active, setActiveState] = useState(false);
  const [points, setPointState] = useState([]);
  const [pointerLocation, setPointerLocation] = useState(null);
  const completed = points.length === 2;

  const onMouseMove = (e) => {
    setPointerLocation(e.lngLat);
  };

  const onMapClick = (e) => {
    const { lngLat } = e;
    e.preventDefault();
    e.originalEvent.stopPropagation();
    setPointState(points => [...points, [lngLat.lng, lngLat.lat]]);
    trackEvent('Map Interaction', "Place 'Measurement Tool' Point");
  };

  const onMapClickToReset = () => {
    setActiveState(false);
    map.off('click', nextClickResetsState.current);
  };

  const onComponentUnmount = () => {
    setActiveState(false);
    unbindRulerMapEvents();
  };

  const resetState = () => {
    setPointState([]);
    setPointerLocation(null);
    map.off('click', nextClickResetsState.current);
  };

  const mouseMoveFunc = useRef(onMouseMove);
  const mapClickFunc = useRef(onMapClick);
  const nextClickResetsState = useRef(onMapClickToReset);

  const bindRulerMapEvents = () => {
    map.on('mousemove', mouseMoveFunc.current);
    map.on('click', mapClickFunc.current);
  };

  const unbindRulerMapEvents = () => {
    map.off('mousemove', mouseMoveFunc.current);
    map.off('click', mapClickFunc.current);
  };

  const toggleActiveState = () => {
    setActiveState(active => !active);
    active?
      trackEvent('Map Interaction', "Dismiss 'Measurement Tool'") :
      trackEvent('Map Interaction', "Click 'Measurement Tool' button");
  }

  useEffect(() => {
    if (completed) {
      unbindRulerMapEvents();
      map.on('click', nextClickResetsState.current);
    } else {
      bindRulerMapEvents();
    }
  }, [completed]);

  useEffect(resetState, [active]);

  useEffect(() => {
    return () => onComponentUnmount();
  }, []);

  return <Fragment>
    <div className={styles.buttons}>
      <button type='button' title='Map ruler' 
        className={`${styles.button} ${active ? 'active' : ''}`} 
        onClick={toggleActiveState}>
        <RulerIcon />
      </button>
      {active && <Button variant='dark' size='sm' id='cancel-location-select' 
        onClick={toggleActiveState} type='button'>
        {completed ? 'Close' : 'Cancel'}
      </Button>}
    </div>
    {active && <MapRulerLayer points={points} pointerLocation={pointerLocation}  />}
  </Fragment>;
};

export default memo(withMap(MapRulerControl));
