import React, { useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import xor from 'lodash/xor';

import { MapContext } from '../App';

const Popup = ({ className = '', trackPointer = false, offset, coordinates, anchor, children }) => {
  const map = useContext(MapContext);

  const classNameRef = useRef('');
  const popupRef = useRef(null);
  const popupContainerRef = useRef(document.createElement('div'));

  useEffect(() => {
    if (!popupRef.current) {
      const popup = new mapboxgl.Popup({ className, offset, anchor, closeButton: false });
      popup.setDOMContent(popupContainerRef.current);

      if (trackPointer) {
        popup.trackPointer();
      } else {
        popup.setLngLat(coordinates);
      }

      popup.on('close', () => {
        popupRef.current = null;
        classNameRef.current = '';
      });

      popupRef.current = popup;

      popupRef.current.addTo(map);
    }
  }, [anchor, className, coordinates, map, offset, trackPointer]);

  useEffect(() => {
    if (popupRef.current) {
      let currentPopup = popupRef.current;

      const classDifferences = xor(
        (classNameRef.current || '').split(' '),
        (className || '').split(' '),
      ).filter(classString =>
        !!classString
      );

      classDifferences.forEach((className) => {
        currentPopup?.toggleClass?.(className);
      });

      classNameRef.current = className;
    }
  }, [className]);

  useEffect(() => {
    if (!trackPointer)  {
      if (popupRef.current && coordinates) {
        popupRef?.current?.setLngLat(coordinates);
      }
    }
  }, [coordinates, trackPointer]);

  useEffect(() => {
    if (popupRef.current) {
      popupRef?.current?.setOffset(offset);
    }
  }, [offset]);

  useEffect(() => {
    return () => {
      popupRef?.current?.remove();
    };
  }, []);

  return createPortal(
    <>{children}</>,
    popupContainerRef.current
  );
};

export default Popup;
