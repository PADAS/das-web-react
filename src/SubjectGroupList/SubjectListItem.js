import React, { memo } from 'react';
import SubjectControls from '../SubjectControls';
import isEqual from 'lodash/isEqual';

const SubjectListItem = memo((props) => {
  const { map, ...rest } = props;
  return <div>
    <h4>{props.name}</h4>
    <SubjectControls map={map} showTitles={false} subject={rest} />
  </div>;
}, (prevProps, currentProps) => isEqual(prevProps, currentProps));

export default SubjectListItem;
