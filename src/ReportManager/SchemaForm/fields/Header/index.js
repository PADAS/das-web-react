import React from 'react';
import { useFieldDetails } from '../../SchemaFormContext';

const Header = ({ fieldName }) => {
  const headerDetails = useFieldDetails(fieldName);
  return <div>{headerDetails.label}</div>;
};

export default Header;
