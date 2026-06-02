import React, { memo, useCallback, useContext } from 'react';
import { useLocation } from 'react-router';

import { TrackerContext } from '../../../utils/analytics';

import Link from '../../../Link';
import PatrolListItem from '../../../PatrolListItem';
import ReportListItem from '../../../ReportListItem';
import { LINK_TYPES, TAB_KEYS } from '../../../constants';

import * as styles from './styles.module.scss';

const LinkItem = ({ item, to, type, fromLabel }) => {
  const analytics = useContext(TrackerContext);
  const location = useLocation();

  const onClick = useCallback(() => {
    analytics?.track(`Navigate to ${type} from links section`);
  }, [analytics, type]);

  if (type === LINK_TYPES.PATROL) {
    // Pass the current location as `from` state so PatrolOverview's breadcrumb
    // can navigate back to this event instead of the patrol list.
    const patrolLinkState = {
      from: location.pathname + location.search,
      fromLabel: fromLabel || 'Event',
    };
    return <Link className={styles.link} to={`/${TAB_KEYS.PATROLS}/${item.id}`} state={patrolLinkState}>
      <PatrolListItem
          className={styles.item}
          patrol={item}
          showControls={false}
          showStateTitle={false}
          showTitleDetails={false}
        />
    </Link>;
  }

  if (type === LINK_TYPES.EVENT) {
    return <Link className={styles.link} onClick={onClick} to={to}>
      <ReportListItem
        className={styles.item}
        report={item}
        showElapsedTime={false}
        showJumpButton={false}
      />
    </Link>;
  }

  return null;
};

export default memo(LinkItem);
