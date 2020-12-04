import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import AddReport from '../AddReport';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

export default class TimepointPopup extends PureComponent {
  render() {
    const { data: { geometry, properties }, ...rest } = this.props;

    const locationObject = {
      longitude: geometry.coordinates[0],
      latitude: geometry.coordinates[1],
    };

    const reportedById = properties.id;

    const time = properties.time;

    return (
      <Popup anchor='bottom' offset={[0, -4]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`} {...rest}>
        <h4>{properties.title || properties.name}</h4>
        {properties.time && <DateTime date={properties.time} />}
        <GpsFormatToggle lng={locationObject.longitude} lat={locationObject.latitude} />
        <hr />
        <AddReport reportData={{ location: locationObject, reportedById, time }} showLabel={false} />
      </Popup>
    );
  }
}

TimepointPopup.propTypes = {
  data: PropTypes.object.isRequired,
};