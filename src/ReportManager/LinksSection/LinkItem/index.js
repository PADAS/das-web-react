import React, { memo, useCallback, useContext } from 'react';
// TODO: Replace with custom link after ERA-8169
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { TrackerContext } from '../../../utils/analytics';

import { openModalForPatrol } from '../../../utils/patrols';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { MapContext } from '../../../App';
import { useFeatureFlag } from '../../../hooks';

import PatrolListItem from '../../../PatrolListItem';
import ReportListItem from '../../../ReportListItem';

import styles from './styles.module.scss';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const LINK_TYPES = { PATROL: 'patrol', REPORT: 'report' };

const LinkItem = ({ item, to, type }) => {
  const map = useContext(MapContext);
  const analytics = useContext(TrackerContext);

  const onClick = useCallback(() => {
    analytics?.track(`Navigate to ${type} from links section`);
  }, [analytics, type]);

  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

  if (type === LINK_TYPES.PATROL) {
    if (enableNewPatrolUI) {
      return <Link className={styles.link} to={`/${TAB_KEYS.PATROLS}/${item.id}`}>
        <PatrolListItem
          className={styles.item}
          patrol={item}
          showControls={false}
          showStateTitle={false}
          showTitleDetails={false}
        />
      </Link>;
    } else {
      return <div onClick={() => openModalForPatrol(item, map)}>
        <PatrolListItem
          className={styles.item}
          patrol={item}
          showControls={false}
          showStateTitle={false}
          showTitleDetails={false}
        />
      </div>;
    }
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
