import React, { memo, useState, useEffect, Fragment, useCallback, useMemo } from 'react';
import { Popup } from 'react-mapbox-gl';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import length from '@turf/length';
import { lineString } from '@turf/helpers';
import isEqual from 'react-fast-compare';

import { calculatePopoverPlacement } from '../utils/map';
import { withMap } from '../EarthRangerMap';
import { ReactComponent as RulerIcon } from '../common/images/icons/ruler-icon.svg';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import { useMapEventBinding } from '../hooks';

import GpsFormatToggle from '../GpsFormatToggle';
import AddReport from '../AddReport';
import { setPickingMapLocationState } from '../ducks/map-ui';
import { calcPositiveBearing } from '../utils/location';

import MapDrawingTools, { DRAWING_MODES } from '../MapDrawingTools';
import { LAYER_IDS } from '../MapDrawingTools/MapLayers';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapRulerControl = (props) => {
  const { map, setPickingMapLocationState } = props;

  const [active, setActiveState] = useState(false);
  const [drawing, setDrawingState] = useState(false);
  const [points, setPoints] = useState([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState(-1);
  const [nextClickResetsState, setNextClickResetsState] = useState(false);

  const toggleActiveState = useCallback(() => {
    const newActiveState = !active;

    setActiveState(newActiveState);

    if (newActiveState) {
      mapInteractionTracker.track('Click \'Measurement Tool\' button');
    } else {
      mapInteractionTracker.track('Dismiss \'Measurement Tool\'');
    }

  }, [active]);

  const onDrawChange = useCallback((points, _geoJsonData) => {
    setPoints(() => points);
  }, []);

  const onClickPoint = useCallback((e) => { // KEEP
    if (!drawing) {
      e.preventDefault();
      e.originalEvent.stopPropagation();

      const pointMatch = points.findIndex(p =>
        isEqual(
          p.map(l =>
            l.toFixed(2)
          ),
          [e.lngLat.lng.toFixed(2), e.lngLat.lat.toFixed(2)]
        )
      );

      if (pointMatch > -1) {
        setSelectedPointIndex(pointMatch);
      }
    }
  }, [drawing, points]);

  const onFinish = useCallback(() => { // KEEP
    setDrawingState(false);
  }, []);

  const popupPointSelected = (selectedPointIndex > -1) && !!points[selectedPointIndex];

  useEffect(() => {
    if (!drawing && active) {
      setNextClickResetsState(true);
    }
  }, [active, drawing]);

  useEffect(() => {
    if (!active || drawing) {
      setNextClickResetsState(false);
    }
  }, [active, drawing]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') { // KEEP
        event.preventDefault();
        event.stopPropagation();
        toggleActiveState();
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

  }, [active, toggleActiveState]);

  useMapEventBinding('dblclick', onFinish, null, drawing);

  useEffect(() => {
    setPickingMapLocationState(active && drawing);
  }, [active, drawing, setPickingMapLocationState]);

  useEffect(() => {
    const onComponentUnmount = () => {
      setActiveState(false);
    };

    return onComponentUnmount;
  }, []);

  useEffect(() => {
    setPoints([]);
    setDrawingState(active);
  }, [active]);

  useEffect(() => {
    if (!drawing && points.length > 1) {
      setSelectedPointIndex(points.length - 1);
    }
  }, [drawing, points.length]);

  useEffect(() => {
    if (drawing && points.length > 1) {
      const handleKeyDown = (event) => {
        const { key } = event;
        if (key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          document.removeEventListener('keydown', handleKeyDown);
          setDrawingState(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [drawing, points.length]);

  useEffect(() => {
    if (nextClickResetsState) {
      const onMapClickToReset = (e) => {
        const isPointClick = !!map.queryRenderedFeatures(e.point, {
          layers: [LAYER_IDS.POINTS],
        }).length;

        if (!isPointClick) {
          setActiveState(false);
          map.off('click', onMapClickToReset);
        }
      };

      map.on('click', onMapClickToReset);

      return () => {
        map.off('click', onMapClickToReset);
      };
    }
  }, [map, nextClickResetsState]);

  return <>
    <div className={styles.buttons}>
      {active && <Button variant='dark' size='sm' id='cancel-location-select'
        onClick={toggleActiveState} type='button'>
        {!drawing ? 'Close' : 'Cancel'}
      </Button>}
      <button type='button' title='Map ruler'
        className={`${styles.button} ${active ? 'active' : ''}`}
        onClick={toggleActiveState}>
        <RulerIcon />
      </button>
    </div>
    {active && points.length > 1 && <>
      {drawing && <MemoizedPointPopup map={map} points={points} pointIndex={points.length - 1} drawing={drawing} onClickFinish={onFinish} />}
      {!drawing && popupPointSelected && <MemoizedPointPopup map={map} points={points} pointIndex={selectedPointIndex} drawing={drawing} />}
    </>}
    {active && <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.POLYGON} points={points} onChange={onDrawChange} onClickPoint={onClickPoint} />}
  </>;
};

export default connect(null, { setPickingMapLocationState })(memo(withMap(MapRulerControl)));


const PointPopup = (props) => {
  const { drawing, map, onClickFinish, pointIndex, points } = props;
  const isFirstPoint = pointIndex === 0;
  const point = points[pointIndex];
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

  const [popoverPlacement, setPopoverPlacement] = useState('auto');

  useEffect(() => {
    const updatePopoverPlacement = async () => {
      const updatedPopoverPlacement = await calculatePopoverPlacement(map, { lat: point[1], lng: point[0] });
      setPopoverPlacement(updatedPopoverPlacement);
    };

    updatePopoverPlacement();
  }, [map, point]);

  if (!point) return null;

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
          category: MAP_INTERACTION_CATEGORY,
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