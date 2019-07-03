import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import EarthRangerMap from '../../Map/index2';


const MainView = (props) => {
  return <div style={{alignItems: 'stretch', display: 'flex', height: '100vh'}}>
    <EarthRangerMap />
    <EarthRangerMap />
  </div>;
};

export default memo(MainView);