import React, { memo } from 'react';

import { withMap } from '../EarthRangerMap';
import LabeledSymbolLayer from '../LabeledSymbolLayer';

import withMapViewConfig from '../WithMapViewConfig';

function LabeledPatrolSymbolLayer(
  { layout, id, ...rest }
) {
  const symbolLayout = {
    'text-field': '{ticker}',
    'text-offset': [1.1, -1.1],
  };

  return <LabeledSymbolLayer 
    id={id}
    layout={symbolLayout}
    {...rest} 
  />;
}

export default memo(withMapViewConfig(withMap(LabeledPatrolSymbolLayer)));
