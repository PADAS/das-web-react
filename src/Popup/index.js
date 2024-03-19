import React, { Fragment, useEffect, useRef } from 'react';
import { withMap } from '../EarthRangerMap';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';

import xor from 'lodash/xor';

const Popup = (props) => {
  const { className, trackPointer, offset, coordinates, anchor, children, map } = props;

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
    <Fragment>{children}</Fragment>,
    popupContainerRef.current
  );
};

Popup.propTypes = {
  anchor: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.exact(null),
  ]),
  className: PropTypes.string,
  coordinates: PropTypes.array.isRequired,
  map: PropTypes.object.isRequired,
  offset: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
  ]),
  trackPointer: PropTypes.bool,
};

Popup.defaultProps = {
  clasName: '',
  trackPointer: false,
};

export default withMap(Popup);
