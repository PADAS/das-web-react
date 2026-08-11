import React from 'react';

import Activity from './Activity';
import Legs from './Legs';

const Overview = ({ patrol }) => <>
  <Legs patrol={patrol} />

  <Activity />
</>;

export default Overview;
