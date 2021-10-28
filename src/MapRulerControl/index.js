import React, { memo, useState, useEffect, useRef, Fragment, useCallback, useMemo } from 'react';
import { Popup } from 'react-mapbox-gl';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import debounce from 'lodash/debounce';
import length from '@turf/length';
import { lineString } from '@turf/helpers';
import isEqual from 'react-fast-compare';

import { calculatePopoverPlacement } from '../utils/map';
import { withMap } from '../EarthRangerMap';
import MapRulerLayer from '../MapRulerLayer';
import { ReactComponent as RulerIcon } from '../common/images/icons/ruler-icon.svg';
import { trackEvent } from '../utils/analytics';

import GpsFormatToggle from '../GpsFormatToggle';
import AddReport from '../AddReport';
import { setPickingMapLocationState } from '../ducks/map-ui';
import { calcPositiveBearing } from '../utils/location';


import { RULER_POINTS_LAYER_ID } from '../MapRulerLayer';

import styles from './styles.module.scss';


const MapRulerControl = (props) => {
  const { map, setPickingMapLocationState } = props;
  const [active, setActiveState] = useState(false);
  const [points, setPointState] = useState([]);
  const [pointerLocation, setPointerLocation] = useState(null);
  const [completed, setCompletedState] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const onMouseMove = (e) => {
    setPointerLocation(e.lngLat);
  };

  const toggleActiveState = useCallback(() => {
    setActiveState(active => !active);
    setCompletedState(false);
    active ?
      trackEvent('Map Interaction', 'Dismiss \'Measurement Tool\'') :
      trackEvent('Map Interaction', 'Click \'Measurement Tool\' button');
  }, [active]);

  const onMapClick = (e) => {
    const { lngLat } = e;
    e.preventDefault();
    e.originalEvent.stopPropagation();
    setPointState(points => [...points, [lngLat.lng, lngLat.lat]]);
  };

  const onMapDblClick = useCallback((e) => {
    onMapClick(e);

    e.preventDefault();
    e.originalEvent.stopPropagation();
    mapClickFunc.current.cancel();

    setCompletedState(true);
  }, []);

  const onMapClickToReset = (e) => {
    const isPointClick = !!map.queryRenderedFeatures(e.point, {
      layers: [RULER_POINTS_LAYER_ID],
    }).length;

    if (!isPointClick) {
      setActiveState(false);
      map.off('click', nextClickResetsState.current);
    }
  };

  const onPointClick = useCallback((e) => {
    e.preventDefault();
    e.originalEvent.stopPropagation();

    const pointMatch = points.find(p =>
      isEqual(
        p.map(l =>
          l.toFixed(2)
        ),
        [e.lngLat.lng.toFixed(2), e.lngLat.lat.toFixed(2)]
      )
    );

    if (pointMatch) {
      setSelectedPoint(pointMatch);
    }
  }, [points]);

  const onClickFinish = useCallback(() => {
    setCompletedState(true);
  }, []);

  const resetState = () => {
    setPointState([]);
    setPointerLocation(null);
    map.off('click', nextClickResetsState.current);
  };

  const mouseMoveFunc = useRef(onMouseMove);
  const mapClickFunc = useRef(debounce(onMapClick, 250));
  const mapDblClickFunc = useRef(onMapDblClick);
  const nextClickResetsState = useRef(onMapClickToReset);

  const bindRulerMapEvents = () => {
    map.on('mousemove', mouseMoveFunc.current);
    map.on('click', mapClickFunc.current);
    map.on('dblclick', mapDblClickFunc.current);
  };

  const unbindRulerMapEvents = () => {
    map.off('mousemove', mouseMoveFunc.current);
    map.off('click', mapClickFunc.current);
    map.off('dblclick', mapDblClickFunc.current);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        toggleActiveState();
      }
      if (key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        setCompletedState(true);
      }
    };
    if (active) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };

  }, [active]); // eslint-disable-line

  useEffect(() => {
    if (completed) {
      unbindRulerMapEvents();
      map.on('click', nextClickResetsState.current);
    } else {
      bindRulerMapEvents();
    }
  }, [completed]); // eslint-disable-line

  useEffect(() => {
    setPickingMapLocationState(active && !completed);
  }, [active, completed, setPickingMapLocationState]);

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


  useEffect(() => {
    if (completed && points.length > 1) {
      setSelectedPoint(points[points.length - 1]);
    }
  }, [completed, points, points.length]);


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
    {active && <Fragment>
      {points.length > 1 && <Fragment>
        {!completed && <MemoizedPointPopup map={map} points={points} point={points[points.length - 1]} drawing={!completed} onClickFinish={onClickFinish} />}
        {completed && !!selectedPoint && <MemoizedPointPopup map={map} points={points} point={selectedPoint} drawing={!completed} />}
      </Fragment>}
      <MapRulerLayer drawing={!completed} onPointClick={onPointClick} points={points} pointerLocation={pointerLocation}  />
    </Fragment>}
  </Fragment>;
};

export default connect(null, { setPickingMapLocationState })(memo(withMap(MapRulerControl)));


const PointPopup = (props) => {
  const { drawing, map, onClickFinish, point, points } = props;
  const pointIndex = points.findIndex(p => isEqual(p, point));
  const isFirstPoint = pointIndex === 0;
  const popupOffset = [0, -4];
  const popupAnchorPosition = 'bottom';

  const distanceFromStart = useMemo(() => {
    if (isFirstPoint) return null;

    const clonedPoints = [...points];
    clonedPoints.length = (pointIndex + 1);

    if (!clonedPoints.length) return null;

    return `${length(lineString(clonedPoints)).toFixed(2)}km`;

  }, [isFirstPoint, pointIndex, points]);

  const bearingFromPrev = useMemo(() => {
    if (isFirstPoint) return null;

    const prevPoint = points[pointIndex - 1];

    if (!prevPoint || !point) return null;

    return calcPositiveBearing(prevPoint, point).toFixed(2);
  }, [isFirstPoint, point, pointIndex, points]);

  const popoverPlacement = calculatePopoverPlacement(map, { lat: point[1], lng: point[0] });

  return <Popup className={`${styles.popup} ${drawing ? styles.unfinished : ''}`} offset={popupOffset} coordinates={point} anchor={popupAnchorPosition}>


    {!drawing && <Fragment>
      <GpsFormatToggle lng={point[0]} lat={point[1]} />
      {points.length > 1 && !isFirstPoint && <Fragment>
        <p>
          <strong>Bearing:</strong> {bearingFromPrev}&deg; <br />
          <strong>Distance from start:</strong> {distanceFromStart}
        </p>
      </Fragment>}
      <AddReport
        analyticsMetadata={{
          category: 'Map Interaction',
          location: 'map ruler popup',
        }}
        reportData={{
          location: {
            latitude: point[1],
            longitude: point[0],
          }
        }}
        popoverPlacement={popoverPlacement}
      />
    </Fragment>}
    {
      drawing && <p onClick={onClickFinish} className={styles.finishButton}>
        <RulerIcon />
        click here to finish
      </p>}
  </Popup>;
};
const MemoizedPointPopup = memo(PointPopup);