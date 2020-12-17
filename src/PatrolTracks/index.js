import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';

import { patrolsWithTrackShown } from '../selectors/patrols';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const { patrols, dispatch:_dispatch, ...rest } = props;

  return <Fragment>
    {patrols
      .map((patrol, index) =>
        <PatrolTrackLayer key={`patrol-track-${patrol.id}-${index}`} patrol={patrol} {...rest} />
      )
    }
  </Fragment>;

};

const mapStateToProps = (state) => ({
  patrols: patrolsWithTrackShown(state),
});

export default connect(mapStateToProps, null)(memo(PatrolTracks));