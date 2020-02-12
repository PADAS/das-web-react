import React, { memo } from 'react';

import { calcIconColorByPriority } from '../utils/event-types';

import DasIcon from '../DasIcon';

const EventTypeListItem = (props) => {
  const { display, default_priority, icon_id, value } = props;
  return <span>
    <DasIcon type='events' color={calcIconColorByPriority(default_priority)} iconId={icon_id || value} />
    {display}
  </span>;
};

export default memo(EventTypeListItem);