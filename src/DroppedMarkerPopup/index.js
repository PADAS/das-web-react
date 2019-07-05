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
  const onSaveSuccess = () => hidePopup(id);

  return <Popup className={styles.popup} anchor='bottom' offset={[0, -26]} coordinates={coords} id='dropped-marker-popup' {...rest}>
    <GpsFormatToggle lat={location.lat} lng={location.lng} />
    <hr ref={containerRef} />
    <AddReport container={containerRef} reportData={{
      location: {
        latitude: location.lat,
        longitude: location.lng,
      }
    }} onSaveSuccess={onSaveSuccess} />
  </Popup>;
};

DroppedMarkerPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default connect(null, { hidePopup })(memo(DroppedMarkerPopup));