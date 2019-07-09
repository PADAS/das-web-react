import React from 'react';
import { connect } from 'react-redux';

const withMapNames = Component => connect(mapStatetoProps, null)(({ showMapNames, ...rest }) => {
  const mapNameLayout = showMapNames ? {} : {
    'text-size': 0
  };
  return <Component mapNameLayout={mapNameLayout} {...rest} />;
});

const mapStatetoProps = ({ view: { showMapNames } }) => ({ showMapNames });

export default withMapNames;
