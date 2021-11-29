import React from 'react';
import { connect } from 'react-redux';
import { toggleTrackTimepointState } from '../ducks/map-ui';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

const MapTrackTimepointsControl = (props) => {
  const { showTrackTimepoints, toggleTrackTimepointState } = props;
  const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

  const handleChange = () => {
    toggleTrackTimepointState();

    mapInteractionTracker.track(`${showTrackTimepoints? 'Uncheck' : 'Check'} 'Show Track Timepoints' checkbox`);
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