import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';

import { patrolShouldBeMeasured } from '../utils/patrols';
import { patrolsWithTrackShown } from '../selectors/patrols';
import { trackTimeEnvelope } from '../selectors/tracks';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const { patrols, dispatch:_dispatch, ...rest } = props;

  return <Fragment>
    {patrols
      .filter(patrolShouldBeMeasured)
      .map((patrol, index) =>
        <PatrolTrackLayer key={`patrol-track-${patrol.id}-${index}`} patrol={patrol} trackTimeEnvelope={trackTimeEnvelope} {...rest} />
      )
    }
  </Fragment>;

};

const mapStateToProps = (state) => ({
  trackTimeEnvelope: trackTimeEnvelope(state),
  patrols: patrolsWithTrackShown(state),
});

export default connect(mapStateToProps, null)(memo(PatrolTracks));