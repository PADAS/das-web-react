import { memo } from 'react';

import { PRIORITY_COLOR_MAP, tokenVar } from '../utils/colors';

import SvgIcon from '../SvgIcon';

const EventTypeListItem = ({ default_priority, display, icon_id, value }) => <span>
  <SvgIcon
    color={tokenVar((PRIORITY_COLOR_MAP[default_priority] ?? PRIORITY_COLOR_MAP[0]).baseToken)}
    iconId={icon_id || value}
    type="events"
  />

  {display}
</span>;

export default memo(EventTypeListItem);
