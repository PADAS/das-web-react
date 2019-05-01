import React, { memo } from 'react';
import PropTypes from 'prop-types';

const Content = (props) => {
  const { featuresByType, name, id } = props;
  return <div>My name is {name}</div>;
};

export default Content;