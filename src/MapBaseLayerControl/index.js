import React, { useState, useRef } from 'react';
import { connect } from 'react-redux';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import { setBaseLayer } from '../ducks/layers';

import { VALID_LAYER_SOURCE_TYPES, TILE_LAYER_SOURCE_TYPES, MAPBOX_STYLE_LAYER_SOURCE_TYPES, GOOGLE_LAYER_SOURCE_TYPES } from '../constants';
import mapboxLogoSrc from '../common/images/icons/mapbox-logo.png';
import genericGlobeLogoSrc from '../common/images/icons/generic-globe-logo.png';
import googleMapsLogoSrc from '../common/images/icons/google-maps-logo.png';
import { ReactComponent as BaseMapIcon } from '../common/images/icons/base-map.svg';

import styles from './styles.module.scss';

const renderLayerLogoSrc = ({ attributes: { type, icon_url } }) => {
  if (icon_url) return icon_url;
  if (type.toLowerCase().includes('mapbox')) return mapboxLogoSrc;
  if (TILE_LAYER_SOURCE_TYPES.includes(type)) return genericGlobeLogoSrc;
  if (MAPBOX_STYLE_LAYER_SOURCE_TYPES.includes(type)) return mapboxLogoSrc;
  if (GOOGLE_LAYER_SOURCE_TYPES.includes(type)) return googleMapsLogoSrc;
};

const BaseLayerControl = (props) => {
  const { baseLayers, currentBaseLayer, setBaseLayer } = props;
  const [popoverOpen, setPopoverOpenState] = useState(false);
  const wrapperRef = useRef(null);

  const togglePopoverState = () => setPopoverOpenState(!popoverOpen);

  const onItemClick = (layer) => {
    setPopoverOpenState(false);
    setBaseLayer(layer);
  };
  

  return <div ref={wrapperRef} className={styles.wrapper}>
    <button title='Set Map Base Layer' type='button' className={styles.button} onClick={togglePopoverState}>
      <BaseMapIcon />
    </button>
    <Overlay placement='auto-end' show={popoverOpen} rootClose onHide={() => setPopoverOpenState(false)} container={wrapperRef.current} target={wrapperRef.current}>
      <Popover className={styles.popup} title='Base Layers'>
        <ul className={styles.layerList}>
          {baseLayers.map(layer => {
            const logoSrc = renderLayerLogoSrc(layer);

            return <li key={`${layer.id}`}>
              <button type='button' onClick={() => onItemClick(layer)} className={layer.id === currentBaseLayer.id ? styles.active : ''}>
              	<img src={logoSrc} alt={`${layer.name} logo`} />
              	{layer.name}
              </button>
            </li>;
          })}
        </ul>
      </Popover>
    </Overlay>
  </div>;
};

const mapStateToProps = ({ data: { baseLayers }, view: { currentBaseLayer } }) => ({
  baseLayers: baseLayers.filter(({ attributes: { type } }) => VALID_LAYER_SOURCE_TYPES.includes(type)),
  currentBaseLayer,
});

export default connect(mapStateToProps, { setBaseLayer })(BaseLayerControl);


/* ADD ALL SOURCES AND LAYERS?
CHANGE WHICH LAYERS ARE VISIBLE
 */