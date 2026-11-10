import { memo } from 'react';

import { STATUSES } from '../constants';

import * as styles from './styles.module.scss';

export const MAX_DISPLAYED_COUNT = 9;

const COLOR_BY_STATUS = {
  [STATUSES.HEALTHY_STATUS]: 'green',
  [STATUSES.UNHEALTHY_STATUS]: 'red',
  [STATUSES.WARNING_STATUS]: 'orange',
};

// A badge with no status flags something new, so it takes the alert color.
const getBadgeColor = (status) => status ? COLOR_BY_STATUS[status] ?? 'gray' : 'red';

const Badge = ({ className = '', count, status, ...otherProps }) => <span
  className={`${styles.badge} ${styles[getBadgeColor(status)]} ${className}`}
  data-testid="badgeIcon"
  {...otherProps}
>
  {!!count && <span>{count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : count}</span>}
</span>;

export default memo(Badge);
