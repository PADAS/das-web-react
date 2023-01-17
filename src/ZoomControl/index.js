import React from 'react';
import { Map } from 'mapbox-gl';
import { withMap } from './context';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0px 1px 4px rgba(0, 0, 0, .3)',
  border: '1px solid rgba(0, 0, 0, 0.1)'
};

const positions = {
  'top-right': { top: 10, right: 10, bottom: 'auto', left: 'auto' },
  'top-left': { top: 10, left: 10, bottom: 'auto', right: 'auto' },
  'bottom-right': { bottom: 10, right: 10, top: 'auto', left: 'auto' },
  'bottom-left': { bottom: 10, left: 10, top: 'auto', right: 'auto' }
};

const buttonStyle = {
  backgroundColor: '#f9f9f9',
  opacity: 0.95,
  transition: 'background-color 0.16s ease-out',
  cursor: 'pointer',
  border: 0,
  height: 26,
  width: 26,
  backgroundImage: 'url(\'https://api.mapbox.com/mapbox.js/v2.4.0/images/icons-000000@2x.png\')',
  backgroundPosition: '0px 0px',
  backgroundSize: '26px 260px',
  outline: 0
};

const buttonStyleHovered = {
  backgroundColor: '#fff',
  opacity: 1
};

const buttonStylePlus = {
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  borderTopLeftRadius: 2,
  borderTopRightRadius: 2
};

const buttonStyleMinus = {
  backgroundPosition: '0px -26px',
  borderBottomLeftRadius: 2,
  borderBottomRightRadius: 2
};

const ZOOM_INTERVAL = 0.5;

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const onClick = (map, direction = 'in') => {
  if (direction === 'in') {

  }
};

const ZoomControl = ({ position, style, className, tabIndex }) => {

  const onZoomControlClick = (map, zoomDiff) => {
    zoomDiff > 0 ?
      map.zoomIn({ level: map.getZoom() + zoomDiff }) :
      map.zoomOut({ level: map.getZoom() - zoomDiff });

    mapInteractionTracker.track(`Click 'Zoom ${zoomDiff > 0?'In':'Out'}' button`);
  };

  const plusStyle = {
    ...buttonStyle,
    ...buttonStylePlus,
  };
  const minusStyle = {
    ...buttonStyle,
    ...buttonStyleMinus,
  };

  return <div
  className={className}
  tabIndex={tabIndex}
  style={{ ...containerStyle, ...positions[position], ...style }}
    >
    <button
    id="zoomIn"
    type="button"
    style={plusStyle}
    aria-label="Zoom in"
    onClick={onZoomControlClick}
  />
    <button
    id="zoomOut"
    type="button"
    style={minusStyle}
    aria-label="Zoom out"
    onClick={onZoomControlClick}
  />
  </div>;
};

export default withMap(ZoomControl);

ZoomControl.defaultProps = {
  zoomDiff: 0.5,
  onControlClick: (map: Map, zoomDiff: number) => {
    map.zoomTo(map.getZoom() + zoomDiff);
  }
};