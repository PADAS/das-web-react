import React, { useMemo } from 'react';

import { useSystemConfigFlag } from '../hooks';


const withFeatureFlag = (flag, Component) => props => {
  const visible = useSystemConfigFlag(flag);
  const propsToWatch = useMemo(() => visible ? [props] : [visible], [props, visible]);

  const returnValue = useMemo(() => visible ? <Component {...props} /> : null, propsToWatch); /* eslint-disable-line */

  return returnValue;
};


export default withFeatureFlag;