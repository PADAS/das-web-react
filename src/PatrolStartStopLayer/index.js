import React, { memo, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { addMapImage } from '../utils/map';
import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { selectPatrolsWithTracks } from '../selectors/patrols';
import { MapContext } from '../MapContext';

import patrolStartPin from '../common/images/icons/patrol-start-pin.svg?url';
import patrolEndPin from '../common/images/icons/patrol-end-pin.svg?url';

import StartStopLayer from './layer';

const PatrolStartStopLayer = () => {
  const map = useContext(MapContext);
  const patrolsWithTracks = useSelector(selectPatrolsWithTracks);

  // The two pins are static shared assets; register them once rather than from
  // each patrol's layer.
  useEffect(() => {
    if (!map) return;
    [patrolStartPin, patrolEndPin].forEach((src) => {
      if (!map.hasImage(calcImgIdFromUrlForMapImages(src))) {
        addMapImage({ src });
      }
    });
  }, [map]);

  return patrolsWithTracks.map((patrol, index) => <StartStopLayer key={index} patrol={patrol} />);
};

export default memo(PatrolStartStopLayer);
