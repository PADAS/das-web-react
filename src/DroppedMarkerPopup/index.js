import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { hidePopup } from '../ducks/popup';

import { withMap } from '../EarthRangerMap';
import AR from '../AddReport';
import GpsFormatToggle from '../GpsFormatToggle';

const AddReport = withMap(AR);

const DroppedMarkerPopup = ({ data: { location }, id, hidePopup, ...rest }) => {
  const containerRef = useRef(null);
  const onComplete = () => {
    hidePopup(id);
  };

  return <>
    <GpsFormatToggle lng={location.lng} lat={location.lat} />
    <hr ref={containerRef} />
    <AddReport showLabel={false} 
      analyticsMetadata={{
        category: 'Map Interaction',
        location: 'dropped marker on map',
      }}
      reportData={{
        location: {
          latitude: location.lat,
          longitude: location.lng,
        }
     
      }}
      formProps={{
        onSaveSuccess: onComplete,
        onSaveError: onComplete,
      }}
    />
  </>;
};

DroppedMarkerPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default connect(null, { hidePopup })(memo(DroppedMarkerPopup));