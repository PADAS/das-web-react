import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { calcIconColorByPriority } from '../utils/event-types';

import DasIcon from '../DasIcon';

const EventTypeListItem = ({ default_priority, display, icon_id, value }) => <span>
  <DasIcon color={calcIconColorByPriority(default_priority)} iconId={icon_id || value} type="events" />

  {display}
</span>;

EventTypeListItem.propTypes = {
  default_priority: PropTypes.number.isRequired,
  display: PropTypes.string.isRequired,
  icon_id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default memo(EventTypeListItem);
