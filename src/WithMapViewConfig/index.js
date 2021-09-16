import React from 'react';
import { connect } from 'react-redux';

import { DEFAULT_SYMBOL_LAYOUT } from '../constants';

const withMapViewConfig = Component => connect(mapStatetoProps, null)(({ showMapNames, simplifyMapDataOnZoom, ...rest }) => {

  const mapUserLayoutConfig = {
    'icon-allow-overlap': simplifyMapDataOnZoom.enabled ? DEFAULT_SYMBOL_LAYOUT['icon-allow-overlap'] : true,
    'text-allow-overlap': simplifyMapDataOnZoom.enabled ? DEFAULT_SYMBOL_LAYOUT['text-allow-overlap'] : true,
  };

  if (!showMapNames) {
    mapUserLayoutConfig['text-size'] = 0;
  }

  return <Component mapUserLayoutConfig={mapUserLayoutConfig} minZoom={simplifyMapDataOnZoom.enabled ? 5 : 0} {...rest} />;
});

const mapStatetoProps = ({ view: { showMapNames, simplifyMapDataOnZoom } }) => ({ showMapNames, simplifyMapDataOnZoom });

export default withMapViewConfig;
