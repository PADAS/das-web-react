import React, { memo } from 'react';
import SubjectControls from '../SubjectControls';

const SubjectListItem = memo((props) => {
  return <div>
    <h4>{props.name}</h4>
    <SubjectControls map={props.map} showTitles={false} subject={props} />
  </div>;
});

export default SubjectListItem;