import React, { memo } from 'react';

const Header = ({ details, id }) => <h4 data-testid={`schema-form-header-${id}`}>{details.label}</h4>;

export default memo(Header);
