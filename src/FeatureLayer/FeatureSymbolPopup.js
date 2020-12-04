import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Popup } from '../PatrolStartStopLayer/node_modules/react-mapbox-gl';
import GpsFormatToggle from '../GpsFormatToggle';


const FeatureSymbolPopup = (props) => {
  const { data: { geometry, properties } } = props;

  const coordinates = Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0] : geometry.coordinates;

  return (
    <Popup anchor='bottom' offset={[0, -26]} coordinates={coordinates} id='feature-symbol-popup'>
      <h4>{properties.title || properties.name}</h4>
      <GpsFormatToggle lng={coordinates[0]} lat={coordinates[1]} />
    </Popup>
  );
};

FeatureSymbolPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default memo(FeatureSymbolPopup);