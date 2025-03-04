import React, { Fragment, memo } from 'react';

import { connect } from 'react-redux';

import { withMap } from '../EarthRangerMap';
import { selectPatrolsWithTracks } from '../selectors/patrols';

import StartStopLayer from './layer';


const PatrolStartStopLayer = ({ patrolsWithTracks }) => {
  const onSymbolClick = () => {};

  return <Fragment>
    {patrolsWithTracks
      .map((patrol, index) => <StartStopLayer key={index} patrol={patrol} onSymbolClick={onSymbolClick} />)}
  </Fragment>;

};

const mapStateToProps = (state) => ({
  patrolsWithTracks: selectPatrolsWithTracks(state),
});


export default connect(mapStateToProps, null)(withMap(
  memo(PatrolStartStopLayer),
));

PatrolStartStopLayer.defaultProps = {
  onPointClick(_layer) {
  },
  showTimepoints: true,
};
