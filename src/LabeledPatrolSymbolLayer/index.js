import React, { memo } from 'react';

import withMapViewConfig from '../WithMapViewConfig';

import LabeledSymbolLayer from '../LabeledSymbolLayer';

const LabeledPatrolSymbolLayer = ({ id, ...otherProps }) => <LabeledSymbolLayer
  id={id}
  layout={{ 'text-field': '{ticker}', 'text-offset': [1.1, -1.1] }}
  {...otherProps}
/>;

export default memo(withMapViewConfig(LabeledPatrolSymbolLayer));
