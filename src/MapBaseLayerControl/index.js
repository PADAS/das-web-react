import React, { useEffect, useState, useRef, memo } from 'react';
import { connect } from 'react-redux';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

import { setBaseLayer } from '../ducks/layers';
import { trackEventFactory, MAP_INTERACTION_CATEGORY, BASE_LAYER_CATEGORY } from '../utils/analytics';

import {
  VALID_LAYER_SOURCE_TYPES,
  TILE_LAYER_SOURCE_TYPES,
  MAPBOX_STYLE_LAYER_SOURCE_TYPES,
  GOOGLE_LAYER_SOURCE_TYPES,
} from '../constants';
import mapboxLogoSrc from '../common/images/icons/mapbox-logo.png';
import genericGlobeLogoSrc from '../common/images/icons/generic-globe-logo.png';
import googleMapsLogoSrc from '../common/images/icons/google-maps-logo.png';

import { ReactComponent as BaseMapIcon } from '../common/images/icons/base-map.svg';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);
const baseLayerTracker = trackEventFactory(BASE_LAYER_CATEGORY);

const renderLayerLogoSrc = ({ attributes: { type, icon_url } }) => {
  if (icon_url) return icon_url;
  if (type.toLowerCase().includes('mapbox')) return mapboxLogoSrc;
  if (TILE_LAYER_SOURCE_TYPES.includes(type)) return genericGlobeLogoSrc;
  if (MAPBOX_STYLE_LAYER_SOURCE_TYPES.includes(type)) return mapboxLogoSrc;
  if (GOOGLE_LAYER_SOURCE_TYPES.includes(type)) return googleMapsLogoSrc;
};

const BaseLayerControl = (props) => {
  const { baseLayers, currentBaseLayer, setBaseLayer } = props;
  const { t } = useTranslation('map-controls', { keyPrefix: 'baseLayer' });
  const [popoverOpen, setPopoverOpenState] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  const togglePopoverState = () => {
    setPopoverOpenState(!popoverOpen);
    mapInteractionTracker.track('Click Base Layer button');
  };

  const onItemClick = (layer) => {
    setBaseLayer(layer);
    baseLayerTracker.track(`Select '${layer.name}' Base Layer`);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        togglePopoverState();
      }
    };
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        togglePopoverState();
      }
    };
    if (popoverOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };

  }, [popoverOpen]); // eslint-disable-line


  return <div className={styles.wrapper} ref={wrapperRef}>
    <button title={t('popoverButton')} type='button' className={styles.button} onClick={togglePopoverState} ref={buttonRef}>
      <BaseMapIcon title={t('popoverButton')} />
    </button>
    <Overlay placement='left' show={popoverOpen} rootClose onHide={() => setPopoverOpenState(false)} container={wrapperRef.current} target={wrapperRef.current}>
      <Popover className={styles.popup} title={t('popoverTitle')}>
        <ul className={styles.layerList}>
          {baseLayers.map(layer => {
            const logoSrc = renderLayerLogoSrc(layer);

            return <li key={`${layer.id}`}>
              <button type='button' onClick={() => onItemClick(layer)} className={layer.id === currentBaseLayer?.id ? styles.active : ''}>
                <img src={logoSrc} alt={t('logoAlt', { logoName: layer.name })} />
                {layer.name ?? t(layer.nameKey)}
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

export default connect(mapStateToProps, { setBaseLayer })(memo(BaseLayerControl));


/* ADD ALL SOURCES AND LAYERS?
CHANGE WHICH LAYERS ARE VISIBLE
 */