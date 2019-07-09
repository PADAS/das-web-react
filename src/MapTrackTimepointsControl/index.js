import React from 'react';
import { connect } from 'react-redux';
import { toggleTrackTimepointState } from '../ducks/map-ui';

const MapTrackTimepointsControl = (props) => {
  const { showTrackTimepoints, toggleTrackTimepointState } = props;

  const handleChange = () => {
    toggleTrackTimepointState();
  };

  return <label>
    <input type='checkbox' id='track-timepoints' name='track-timepoints' checked={showTrackTimepoints} onChange={handleChange} />
    <span style={{ paddingLeft: '0.4rem' }} >Show Track Timepoints</span>
  </label>;
};

const mapStateToProps = ({ view: { showTrackTimepoints } }) => ({
  showTrackTimepoints,
});

export default connect(mapStateToProps, { toggleTrackTimepointState })(MapTrackTimepointsControl);