import React, { Fragment, memo } from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import { withMap } from '../EarthRangerMap';
import { patrolsWithTrackShown } from '../selectors/patrols';

import StartStopLayer from './layer';


const PatrolStartStopLayer = ({ allowOverlap, map, mapUserLayoutConfig, onPointClick, patrols, showTimepoints, trackData, ...props}) => {
  const onSymbolClick = () => {};

  return <Fragment>
    {patrols.map((patrol, index) => <StartStopLayer key={index} patrol={patrol} onSymbolClick={onSymbolClick} />)}
  </Fragment>;

};

const mapStateToProps = (state) => ({
  patrols: patrolsWithTrackShown(state),
});


export default connect(mapStateToProps, null)(withMap(
  memo(PatrolStartStopLayer),
));

PatrolStartStopLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

PatrolStartStopLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
};
