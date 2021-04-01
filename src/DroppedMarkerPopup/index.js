import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Popup } from 'react-mapbox-gl';

import { hidePopup } from '../ducks/popup';

import { withMap } from '../EarthRangerMap';
import AR from '../AddReport';
import GpsFormatToggle from '../GpsFormatToggle';

import styles from './styles.module.scss';

const AddReport = withMap(AR);

const DroppedMarkerPopup = ({ data: { location }, id, hidePopup, ...rest }) => {
  const containerRef = useRef(null);
  const coords = [location.lng, location.lat];
  const onComplete = () => {
    hidePopup(id);
  };

  return <Popup className={styles.popup} anchor='bottom' offset={[0, -26]} coordinates={coords} id='dropped-marker-popup' {...rest}>
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
  </Popup>;
};

DroppedMarkerPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default connect(null, { hidePopup })(memo(DroppedMarkerPopup));