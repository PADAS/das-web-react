import React, { memo, useState, useEffect, Fragment, useCallback } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';

import { withMap } from '../EarthRangerMap';
import { ReactComponent as RulerIcon } from '../common/images/icons/ruler-icon.svg';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import { setMapInteractionIsPickingLocation } from '../ducks/map-ui';

import PointPopup from './PointPopup';

import { useMapEventBinding } from '../hooks';

import MapDrawingTools, { DRAWING_MODES } from '../MapDrawingTools';
import { LAYER_IDS } from '../MapDrawingTools/MapLayers';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapRulerControl = (props) => {
  const { map, setMapInteractionIsPickingLocation } = props;

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
    setMapInteractionIsPickingLocation(active && drawing);
  }, [active, drawing, setMapInteractionIsPickingLocation]);

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
    if (map && nextClickResetsState) {
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
      {drawing && <PointPopup map={map} points={points} pointIndex={points.length - 1} drawing={drawing} onClickFinish={onFinish} />}
      {!drawing && popupPointSelected && <PointPopup map={map} points={points} pointIndex={selectedPointIndex} drawing={drawing} />}
    </>}
    {active && <MapDrawingTools drawing={drawing} drawingMode={DRAWING_MODES.LINE} points={points} onChange={onDrawChange} onClickPoint={onClickPoint} />}
  </>;
};

export default connect(null, { setMapInteractionIsPickingLocation })(memo(withMap(MapRulerControl)));


