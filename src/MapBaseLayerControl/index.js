import React, { useState, useRef } from 'react';
import { connect } from 'react-redux';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import { setBaseLayer } from '../ducks/layers';

import { ReactComponent as BaseMapIcon } from '../common/images/icons/base-map.svg';

import styles from './styles.module.scss';

const BaseLayerControl = (props) => {
  const { baseLayers, currentBaseLayer, setBaseLayer } = props;
  const [popoverOpen, setPopoverOpenState] = useState(false);
  const wrapperRef = useRef(null);

  const togglePopoverState = () => setPopoverOpenState(!popoverOpen);

  return <div ref={wrapperRef}>
    <button title='Set Map Base Layer' style={{ position: 'absolute', left: '0.6rem', bottom: '10rem' }} type='button' className={`${styles.button} ${popoverOpen ? 'active' : ''}`} onClick={togglePopoverState}>
      <BaseMapIcon />
    </button>
    <Overlay show={popoverOpen} rootClose  onHide={() => setPopoverOpenState(false)} container={wrapperRef.current} target={wrapperRef.current}>
      <Popover placement='auto' title='Base Layers'>
        <ul>
          {baseLayers.map(layer => {
            return <li key={`${layer.id}`} onClick={() => setBaseLayer(layer)}>
              {layer.name}
            </li>;
          })}
        </ul>
      </Popover>
    </Overlay>
  </div>;
};

const mapStateToProps = ({ data: { baseLayers }, view: { currentBaseLayer } }) => ({
  baseLayers,
  currentBaseLayer,
});

export default connect(mapStateToProps, { setBaseLayer })(BaseLayerControl);
