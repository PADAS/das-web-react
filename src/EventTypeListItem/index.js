import React, { memo } from 'react';

import { calcIconColorByPriority } from '../utils/event-types';

import DasIcon from '../DasIcon';

const EventTypeListItem = (props) => {
  const { display, default_priority, value } = props;
  return <span>
    <DasIcon type='events' color={calcIconColorByPriority(default_priority)} iconId={value} />
    {display}
  </span>;
};

export default memo(EventTypeListItem);