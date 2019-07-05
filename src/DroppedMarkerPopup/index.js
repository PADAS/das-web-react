import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import { withMap } from '../EarthRangerMap';
import AR from '../AddReport';
import GpsFormatToggle from '../GpsFormatToggle';

const AddReport = withMap(AR);

const DroppedMarkerPopup = ({ data: { location }, ...rest }) => {
  const containerRef = useRef(null);
  const coords = [location.lng, location.lat];

  return <Popup anchor='bottom' offset={[0, -26]} coordinates={coords} id='dropped-marker-popup' {...rest}>
    <GpsFormatToggle lat={location.lat} lng={location.lng} />
    <hr ref={containerRef} />
    <AddReport container={containerRef} reportData={{
      location: {
        latitude: location.lat,
        longitude: location.lng,
      }
    }} />
  </Popup>;
};

DroppedMarkerPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default memo(DroppedMarkerPopup);