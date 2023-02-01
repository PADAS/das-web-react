import React, { Fragment, useEffect, useRef } from 'react';
import { withMap } from '../EarthRangerMap';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';

import xor from 'lodash/xor';

const Popup = (props) => {
  const { className, offset, coordinates, anchor, children, map } = props;

  const classNameRef = useRef(className);

  const popupRef = useRef(null);
  const popupContainerRef = useRef(document.createElement('div'));

  useEffect(() => {
    if (!popupRef.current) {
      const popup = new mapboxgl.Popup({ className, offset, anchor });
      popup.setDOMContent(popupContainerRef.current);
      popup.setLngLat(coordinates);

      popup.on('open', () => {
        console.log('now i am opening');
      });

      popup.on('close', () => {
        console.log('now i am closing');
        popupRef.current = null;
        classNameRef.current = '';
      });

      popupRef.current = popup;

      setTimeout(() => {
        popupRef.current.addTo(map);
      });
    }


  }, [anchor, className, offset, coordinates, map]);

  useEffect(() => {
    if (popupRef.current) {
      const classDifferences = xor(
        classNameRef.current.split(' '),
        className.split(' '),
      ).filter(classString =>
        !!classString
      );

      classDifferences.forEach((className) => {
        popupRef.current.toggleClass(className);
      });

      classNameRef.current = className;
    }
  }, [className]);

  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.setLngLat(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.setOffset(offset);
    }
  }, [offset]);

  return !!popupRef.current && createPortal(
    <Fragment>{children}</Fragment>,
    popupContainerRef.current
  );
};

export default withMap(Popup);

/* 
  1. renders new popup content on any prop change
  2. replaces popup html content with rendered changes
  3. closes on map click

*/