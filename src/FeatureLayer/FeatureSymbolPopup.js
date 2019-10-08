import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import GpsFormatToggle from '../GpsFormatToggle';

export default class FeatureSymbolPopup extends PureComponent {
  render() {
    const { data: { geometry, properties }, ...rest } = this.props;

    return (
      <Popup anchor='bottom' offset={[0, -4]} coordinates={geometry} id='feature-symbol-popup' >
        <h4>{properties.title || properties.name}</h4>
        <GpsFormatToggle lng={geometry.lng} lat={geometry.lat} />
      </Popup>
    );
  }
}

FeatureSymbolPopup.propTypes = {
  data: PropTypes.object.isRequired,
};