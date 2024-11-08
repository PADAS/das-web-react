import React from 'react';

import useFieldDetails from '../../useFieldDetails';

const Header = ({ fieldName }) => {
  const headerDetails = useFieldDetails(fieldName);
  return <div>{headerDetails.label}</div>;
};

export default Header;
