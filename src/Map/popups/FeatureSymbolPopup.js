import React, { memo } from 'react';
import PropTypes from 'prop-types';
import GpsFormatToggle from '../../user/preferences/GpsFormatToggle';


const FeatureSymbolPopup = (props) => {
  const { data: { geometry, properties } } = props;

  const coordinates = Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0] : geometry.coordinates;

  return (
    <>
      <h4>{properties.title || properties.name}</h4>
      <GpsFormatToggle lng={coordinates[0]} lat={coordinates[1]} />
    </>
  );
};

FeatureSymbolPopup.propTypes = {
  data: PropTypes.object.isRequired,
};

export default memo(FeatureSymbolPopup);