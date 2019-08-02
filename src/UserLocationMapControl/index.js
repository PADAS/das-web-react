import React, { memo } from 'react';
import ReactGA from 'react-ga';
import { connect } from 'react-redux';
import { toggleDisplayUserLocation } from '../ducks/map-ui';

const UserLocationMapControl = (props) => {

  const { showUserLocation, toggleDisplayUserLocation } = props;

  const handleChange = () => {
    toggleDisplayUserLocation();

    ReactGA.event({
      category: 'Map Interaction',
      action: 'Click',
      label: 'Show My Current Location:' + showUserLocation.toString(),
    });
};

  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={showUserLocation} onChange={handleChange}/>
    <span style={{paddingLeft: '.4rem'}}>Show My Current Location</span>
  </label>;
};

const mapStateToProps = ( {view:{ showUserLocation }} ) => ({
  showUserLocation,
});

export default connect(mapStateToProps, { toggleDisplayUserLocation })(memo(UserLocationMapControl));