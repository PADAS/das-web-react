import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import length from '@turf/length';

function TrackLength(props) {
  const { tracks, id, className, ...rest } = props;

  if (!tracks) return null;
  return <span className={className || ''} {...rest}>Track length: {length(tracks).toFixed(2)} kilometers</span>;

}

const mapStateToProps = ({ data: { tracks } }, ownProps) => ({ tracks: tracks[ownProps.id] });

export default connect(mapStateToProps, null)(TrackLength);

TrackLength.propTypes = {
  id: PropTypes.string.isRequired,
  tracks: PropTypes.object,
  className: PropTypes.string,
}; 