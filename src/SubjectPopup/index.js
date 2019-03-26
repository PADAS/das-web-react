import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

export default class SubjectPopup extends PureComponent {
  render() {
    const { subject: { geometry, properties }, ...rest } = this.props;

    return (
      <Popup coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
        <h4>{properties.name}</h4>
      </Popup>
    );
  }
}

SubjectPopup.propTypes = {
  subject: PropTypes.object.isRequired,
};