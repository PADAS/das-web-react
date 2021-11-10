import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { hidePopup } from '../../../ducks/popup';

import { withMap } from '../../EarthRangerMap';
import AR from '../../../events/forms/AddEvent';
import GpsFormatToggle from '../../../user/preferences/GpsFormatToggle';

const AddEvent = withMap(AR);

const DroppedMarkerPopup = ({ data: { location }, id, hidePopup, popoverPlacement }) => {
  const containerRef = useRef(null);
  const onComplete = () => {
    hidePopup(id);
  };

  return (
    <>
      <GpsFormatToggle lng={location.lng} lat={location.lat} />
      <hr ref={containerRef} />
      <AddEvent
        showLabel={false}
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
        popoverPlacement={popoverPlacement}
      />
    </>
  );
};

DroppedMarkerPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default connect(null, { hidePopup })(memo(DroppedMarkerPopup));