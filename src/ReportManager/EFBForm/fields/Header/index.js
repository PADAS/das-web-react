import React from 'react';

const Header = ({ label, size, section, name }) => {
  console.log(size, section, name);
  return <div>{label}</div>;
};

export default Header;
