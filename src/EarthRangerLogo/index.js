import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';

const SOURCES = {
  horizontal: '#earth-ranger-logo-horizontal',
  horizontalWhite: '#earth-ranger-logo-horizontal-white',
  vertical: '#earth-ranger-logo-vertical',
};

const EarthRangerLogo = memo((props) => {

  const { type, ...rest } = props;

  return (
    <svg {...rest}>
      <title>EarthRanger Logo</title>
      <use href={SOURCES[type] || SOURCES.horizontalWhite} />
    </svg>
  );
});

export default EarthRangerLogo;


EarthRangerLogo.defaultProps = {
  type: 'horizontalWhite',
};

EarthRangerLogo.propTypes = {
  type: PropTypes.string,
};
