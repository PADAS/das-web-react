import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import length from '@turf/length';

import { trimmedTrack } from '../selectors/tracks';

function TrackLength(props) {
  const { tracks, className } = props;

  if (!tracks) return null;
  return <span className={className || ''}>Track length: {length(tracks).toFixed(2)} kilometers</span>;

}

const mapStateToProps = (state, props) => ({
  tracks: trimmedTrack(state, props),
});

export default connect(mapStateToProps, null)(TrackLength);

TrackLength.propTypes = {
  trackId: PropTypes.string.isRequired,
  tracks: PropTypes.object,
  className: PropTypes.string,
}; 