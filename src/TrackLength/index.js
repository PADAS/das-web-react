import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import length from '@turf/length';
import isEqual from 'lodash/isEqual';

function TrackLength(props) {
  const { tracks, id, className, ...rest } = props;

  if (!tracks) return null;
  return <span className={className || ''}>Track length: {length(tracks).toFixed(2)} kilometers</span>;

}

const mapStateToProps = ({ data: { tracks } }, ownProps) => ({ tracks: tracks[ownProps.id] });

export default connect(mapStateToProps, null)(TrackLength);

TrackLength.propTypes = {
  id: PropTypes.string.isRequired,
  tracks: PropTypes.object,
  className: PropTypes.string,
}; 