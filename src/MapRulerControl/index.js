import React, { memo, useState, useEffect, useRef, Fragment } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';

import { withMap } from '../EarthRangerMap';
import MapRulerLayer from '../MapRulerLayer';
import { ReactComponent as RulerIcon } from '../common/images/icons/ruler-icon.svg';
import { trackEvent } from '../utils/analytics';

import { setPickingMapLocationState } from '../ducks/map-ui';

import styles from './styles.module.scss';

const MapRulerControl = (props) => {
  const { map, setPickingMapLocationState } = props;
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
  };

  const onMapClickToReset = () => {
    setActiveState(false);
    map.off('click', nextClickResetsState.current);
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
    active ?
      trackEvent('Map Interaction', 'Dismiss \'Measurement Tool\'') :
      trackEvent('Map Interaction', 'Click \'Measurement Tool\' button');
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        toggleActiveState();
      }
    };
    if (active) {
      document.addEventListener('keydown', handleKeyDown);
      setPickingMapLocationState(true);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      setPickingMapLocationState(false);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      setPickingMapLocationState(false);
    };
  
  }, [active]); // eslint-disable-line

  useEffect(() => {
    if (completed) {
      unbindRulerMapEvents();
      setPickingMapLocationState(false);
      map.on('click', nextClickResetsState.current);
    } else {
      bindRulerMapEvents();
    }
  }, [completed]); // eslint-disable-line

  useEffect(resetState, [active]);

  useEffect(() => {
    if (active) {
      if (points.length === 1) {
        trackEvent('Map Interaction', 'Place Start of \'Measurement Tool\'');
      } else if (points.length === 2) {
        trackEvent('Map Interaction', 'Place End of \'Measurement Tool\'');
      }
    }
  }, [points]); // eslint-disable-line

  useEffect(() => {
    const onComponentUnmount = () => {
      setActiveState(false);
      unbindRulerMapEvents();
    };
  
    return () => onComponentUnmount();
  }, []); // eslint-disable-line


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

export default connect(null, { setPickingMapLocationState })(memo(withMap(MapRulerControl)));
