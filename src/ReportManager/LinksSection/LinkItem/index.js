import React, { memo, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';

import { TAB_KEYS } from '../../../constants';
import { TrackerContext } from '../../../utils/analytics';

import Link from '../../../Link';
import PatrolListItem from '../../../PatrolListItem';
import ReportListItem from '../../../ReportListItem';

import styles from './styles.module.scss';

const LINK_TYPES = { PATROL: 'patrol', REPORT: 'report' };

const LinkItem = ({ item, to, type }) => {
  const analytics = useContext(TrackerContext);

  const onClick = useCallback(() => {
    analytics?.track(`Navigate to ${type} from links section`);
  }, [analytics, type]);

  if (type === LINK_TYPES.PATROL) {
    return <Link className={styles.link} to={`/${TAB_KEYS.PATROLS}/${item.id}`}>
      <PatrolListItem
          className={styles.item}
          patrol={item}
          showControls={false}
          showStateTitle={false}
          showTitleDetails={false}
        />
    </Link>;
  }

  if (type === LINK_TYPES.REPORT) {
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

LinkItem.propTypes = {
  item: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
};

export default memo(LinkItem);
