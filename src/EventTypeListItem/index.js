import React, { memo } from 'react';

import { calcIconColorByPriority } from '../utils/event-types';

import EventIcon from '../EventIcon';

const EventTypeListItem = (props) => {
  const { display, default_priority, value } = props;
  return <span>
    <EventIcon color={calcIconColorByPriority(default_priority)} iconId={value} />
    {display}
  </span>;
};

export default memo(EventTypeListItem);