import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';

import { getPatrolTrackList } from '../selectors/patrols';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const { patrols } = props;

  return <Fragment>{patrols.map(patrol => <PatrolTrackLayer key={patrol.id} patrol={patrol} />)}</Fragment>;

};

const mapStateToProps = (state) => ({
  patrols: getPatrolTrackList(state),
});

export default connect(mapStateToProps, null)(memo(PatrolTracks));