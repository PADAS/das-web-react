import React, { memo } from 'react';
import { connect } from 'react-redux';
import { toggleDisplayUserLocation } from '../ducks/map-ui';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const UserLocationMapControl = (props) => {

  const { showUserLocation, toggleDisplayUserLocation } = props;

  const handleChange = () => {
    toggleDisplayUserLocation();

    mapInteractionTracker.track(`${showUserLocation? 'Uncheck' : 'Check'} 'Show My Current Location' checkbox`);
  };

  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={showUserLocation} onChange={handleChange}/>
    <span style={{ paddingLeft: '.4rem' }}>Show My Current Location</span>
  </label>;
};

const mapStateToProps = ( { view: { showUserLocation } } ) => ({
  showUserLocation,
});

export default connect(mapStateToProps, { toggleDisplayUserLocation })(memo(UserLocationMapControl));