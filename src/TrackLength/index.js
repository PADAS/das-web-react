import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import length from '@turf/length';

import { trimmedVisibleTrackData } from '../selectors/tracks';

// import { trimmedTrack } from '../selectors/tracks';

function TrackLength(props) {
  const { tracks, trackId, className } = props;
  const [trackFeature, setTrackFeature] = useState();

  useEffect(() => {
    const match = tracks.find(({ track }) => !!track && track.features[0].properties.id === trackId);
    if (match) {
      setTrackFeature(match.track.features[0]);
    }
  }, [trackId, tracks]);

  if (!trackFeature) return null;

  return <div className={className || ''}>
    <span><strong>Track length</strong></span>
    <span>{length(trackFeature).toFixed(2)} kilometers</span>
  </div>;

}

const mapStateToProps = (state, props) => {
  return {
    tracks: trimmedVisibleTrackData(state),
  };
};

export default connect(mapStateToProps, null)(TrackLength);

TrackLength.propTypes = {
  trackId: PropTypes.string.isRequired,
  tracks: PropTypes.array,
  className: PropTypes.string,
};