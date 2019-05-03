import React, { memo } from 'react';

import listStyles from '../SideBar/styles.module.scss';

const FeatureListItem = memo((props) => {
  const { properties, map, geometry } = props;
  return <div>
    <h6 className={listStyles.itemTitle}>{properties.title}</h6>
  </div>;
});

export default FeatureListItem;