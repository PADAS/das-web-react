import React, { memo } from 'react';

import { calcUrlForImage } from '../../utils/img';

const NavHomeItem = ({ icon, showIcon, title, name }) => <>
  {!!icon && !!showIcon && <img alt={title} src={calcUrlForImage(icon.src)} />}

  {(title || name) && <h6>{title || name}</h6>}
</>;

export default memo(NavHomeItem);
