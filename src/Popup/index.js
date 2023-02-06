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
      const popup = new mapboxgl.Popup({ className, offset, anchor, closeButton: false });
      popup.setDOMContent(popupContainerRef.current);
      popup.setLngLat(coordinates);

      popup.on('close', () => {
        popupRef.current = null;
        classNameRef.current = '';
      });

      popupRef.current = popup;

      popupRef.current.addTo(map);
    }


  }, [anchor, className, offset, coordinates, map]);

  useEffect(() => {
    if (popupRef.current) {
      const classDifferences = xor(
        (classNameRef.current || '').split(' '),
        (className || '').split(' '),
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
    null,
  ]),
  className: PropTypes.string,
  coordinates: PropTypes.array.isRequired,
  map: PropTypes.object.isRequired,
  offset: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
  ]),
};

Popup.defaultProps = {
  clasName: '',
};

export default withMap(Popup);
