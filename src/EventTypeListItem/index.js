import React, { memo } from 'react';

import { calcIconColorByPriority } from '../utils/event-types';

import EventIcon from '../EventIcon';

const EventTypeListItem = (props) => {
  const { className, display, default_priority } = props;
  return <span className={className}>
    <EventIcon report={props} fromSprite={false} color={calcIconColorByPriority(default_priority)} />
    {display}
  </span>;
};

export default memo(EventTypeListItem);