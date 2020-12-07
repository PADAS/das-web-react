import React, { memo } from 'react';
import { connect } from 'react-redux';
import TrackLegend from '../TrackLegend';

import { updateTrackState } from '../ducks/map-ui';
import { trimmedVisibleTrackData } from '../selectors/tracks';


const mapStateToProps = (state) => ({
  trackState: state.view.subjectTrackState,
  trackData: trimmedVisibleTrackData(state),
});

const mapDispatchToProps = dispatch => ({
  updateTrackState: update => dispatch(updateTrackState(update)),
});

export default connect(mapStateToProps, mapDispatchToProps)(memo(TrackLegend));