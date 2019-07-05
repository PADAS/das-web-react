import React, { memo } from 'react';
import SubjectControls from '../SubjectControls';
import isEqual from 'react-fast-compare';

import listStyles from '../SideBar/styles.module.scss';

const SubjectListItem = memo((props) => { // eslint-disable-line react/display-name
  const { map, ...rest } = props;
  return <div>
    <h6 className={listStyles.itemTitle}>{props.name}</h6>
    <SubjectControls className={listStyles.controls} map={map} showTitles={false} subject={rest} />
  </div>;
}, (prevProps, currentProps) => isEqual(prevProps, currentProps));

export default SubjectListItem;
