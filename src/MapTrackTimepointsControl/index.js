import React from 'react';
import ReactGA from 'react-ga';
import { connect } from 'react-redux';
import { toggleTrackTimepointState } from '../ducks/map-ui';

const MapTrackTimepointsControl = (props) => {
  const { showTrackTimepoints, toggleTrackTimepointState } = props;

  const handleChange = () => {
    toggleTrackTimepointState();

    ReactGA.event({
      category: 'Map Interaction',
      action: "Click 'Show Track Timepoints' checkbox",
      label: 'Show Track Timepoints:' + (showTrackTimepoints).toString(),
    });
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