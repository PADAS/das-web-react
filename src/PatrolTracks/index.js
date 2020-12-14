import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';

import { patrolTrackData } from '../selectors/patrols';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const { patrolTracks, dispatch:_dispatch, ...rest } = props;

  return <Fragment>{patrolTracks.map(({ trackData }, index) => <PatrolTrackLayer key={`patrol-track-${trackData.track.features[0].properties.id}-${index}`} trackData={trackData} {...rest} />)}</Fragment>;

};

const mapStateToProps = (state) => ({
  patrolTracks: patrolTrackData(state),
});

export default connect(mapStateToProps, null)(memo(PatrolTracks));