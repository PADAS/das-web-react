import React, { memo } from 'react';
import SubjectControls from '../SubjectControls';

import listStyles from '../SideBar/styles.module.scss';

const SubjectListItem = (props) => { // eslint-disable-line react/display-name
  const { map, ...rest } = props;
  return <div>
    <span className={listStyles.itemTitle}>{props.name}</span>
    <SubjectControls className={listStyles.controls} map={map} showTitles={false} subject={rest} />
  </div>;
};

export default memo(SubjectListItem);
