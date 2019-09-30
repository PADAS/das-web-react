import React, { Fragment, memo } from 'react';
import { calcUrlForImage } from '../../utils/img';


const NavHomeItem = ({ icon, title, name }) => {
  const displayTitle = title || name || null;
  return (
    <Fragment>
      {!!icon &&
        <img alt={title} src={calcUrlForImage(icon.src)} />
      }
      {!!displayTitle &&
        <h6>{displayTitle}</h6>
      }
    </Fragment>
  );
};

export default memo(NavHomeItem);
