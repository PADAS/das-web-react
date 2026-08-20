import React, { memo } from 'react';

import { calcIconColorByPriority } from '../utils/event-types';

import SvgIcon from '../SvgIcon';

const EventTypeListItem = ({ default_priority, display, icon_id, value }) => <span>
  <SvgIcon color={calcIconColorByPriority(default_priority)} iconId={icon_id || value} type="events" />

  {display}
</span>;

export default memo(EventTypeListItem);
