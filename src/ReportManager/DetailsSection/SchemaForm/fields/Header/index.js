import React, { useContext } from 'react';

import SchemaFormContext from '../../SchemaFormContext';

const Header = ({ id }) => {
  const { fields } = useContext(SchemaFormContext);

  const { details } = fields[id];

  return <h4 data-testid={`schema-form-header-${id}`}>{details.label}</h4>;
};

export default Header;
