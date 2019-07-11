import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';

import { TILE_LAYER_SOURCE_TYPES } from '../constants';

import TileLayerRenderer from './TileLayerRenderer';

const BaseLayerRenderer = (props) => {
  const { baseLayers, currentBaseLayer } = props;

  const tileLayers = baseLayers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type));

  return <Fragment>
    <TileLayerRenderer layers={tileLayers} currentBaseLayer={currentBaseLayer} />
  </Fragment>;
};

const mapStateToProps = ({ data: { baseLayers }, view: { currentBaseLayer } }) => ({
  baseLayers,
  currentBaseLayer,
});

export default connect(mapStateToProps, null)((memo(BaseLayerRenderer)));