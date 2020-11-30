import React, { memo } from 'react';
import { connect } from 'react-redux';
import TrackLegend from '../TrackLegend';

import { updatePatrolTrackState } from '../ducks/patrols';
import { patrolTrackData } from '../selectors/patrols';


const mapStateToProps = (state) => ({
  trackState: state.view.patrolTrackState,
  trackData: patrolTrackData(state),
});

const mapDispatchToProps = dispatch => ({
  updateTrackState: update => dispatch(updatePatrolTrackState(update)),
});

export default connect(mapStateToProps, mapDispatchToProps)(memo(TrackLegend));