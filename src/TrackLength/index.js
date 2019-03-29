import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import length from '@turf/length';

class TrackLength extends PureComponent {
  render() {
    const { tracks, id, className, ...rest } = this.props;
    return tracks[id] ?
    (<span className={className || ''}>Track length: {length(tracks[id]).toFixed(2)} kilometers</span>) : null;
  }
}

const mapStateToProps = ({ data: { tracks } }) => ({ tracks });

export default connect(mapStateToProps, null)(TrackLength);

TrackLength.propTypes = {
  id: PropTypes.string.isRequired,
}; 