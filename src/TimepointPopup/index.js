import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

export default class TimepointPopup extends PureComponent {
  render() {
    const { data: { geometry, properties }, ...rest } = this.props;

    return (
      <Popup anchor='bottom' offset={[0, -4]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`} {...rest}>
        <h4>{properties.title || properties.name}</h4>
        {properties.time && <DateTime date={properties.time} />}
        <GpsFormatToggle lat={geometry.coordinates[1]} lng={geometry.coordinates[0]} />
      </Popup>
    );
  }
}

TimepointPopup.propTypes = {
  data: PropTypes.object.isRequired,
};