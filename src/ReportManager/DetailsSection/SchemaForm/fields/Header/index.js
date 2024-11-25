import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { SchemaFormContext } from '../../SchemaFormContext';

const Header = ({ id }) => {
  const { fields } = useContext(SchemaFormContext);

  const { details } = fields[id];

  return <h4>{details.label}</h4>;
};

Header.propTypes = { id: PropTypes.string.isRequired };

export default Header;
