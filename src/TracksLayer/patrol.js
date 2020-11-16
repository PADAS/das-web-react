import React, { Fragment, memo } from 'react';
import PropTypes from 'prop-types';

import { Marker } from 'react-mapbox-gl';


function PatrolMarker({location, location: { latitude, longitude }, is_patrol_end, is_patrol_start}) {
  console.log({location})
  return <Marker coordinates={[longitude, latitude]}>
    {is_patrol_end && <img src="https://img.icons8.com/officel/80/000000/marker.png"/>}
    {is_patrol_start && <img src="https://img.icons8.com/ultraviolet/80/000000/marker.png"/>}
  </Marker>
}

function PatrolLayer({trackData: { patrol_points }}) {
  if (!patrol_points) {
    return <Fragment />;
  }
  
  const { start_location, end_location } = patrol_points;

  console.log({patrol_points});

  return <Fragment>
    <PatrolMarker 
      location={start_location}
      is_patrol_start
    />

    <PatrolMarker 
      location={end_location}
      is_patrol_end
    />
  </Fragment>
}

export default memo(PatrolLayer);

PatrolLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

PatrolLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
  trackCollection: PropTypes.object,
  trackPointCollection: PropTypes.object,
};
