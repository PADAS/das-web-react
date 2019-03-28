import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

export default class SubjectPopup extends PureComponent {
  render() {
    const { data: { geometry, properties }, ...rest } = this.props;

    return (
      <Popup offset={[0, -16]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
        <h4>{properties.name}</h4>
        {properties.last_position_date && <DateTime date={properties.last_position_date} />}
        {<GpsFormatToggle lat={geometry.coordinates[1]} lng={geometry.coordinates[0]} />}
      </Popup>
    );
  }
}

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
};