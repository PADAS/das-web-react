import React, { Fragment, memo } from 'react';

const SubjectListItem = memo((props) => {
  return <h4>{props.name}</h4>
});

export default SubjectListItem;