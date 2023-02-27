import React, { memo, useCallback, useContext } from 'react';
// TODO: Replace with custom link after ERA-8169
import { Link, useLinkClickHandler } from 'react-router-dom';
import PropTypes from 'prop-types';

import { TrackerContext } from '../../../utils/analytics';

import { openModalForPatrol } from '../../../utils/patrols';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../../constants';
import { MapContext } from '../../../App';

import PatrolListItem from '../../../PatrolListItem';
import ReportListItem from '../../../ReportListItem';

import styles from './styles.module.scss';

const { ENABLE_PATROL_NEW_UI } = DEVELOPMENT_FEATURE_FLAGS;

const LINK_TYPES = { PATROL: 'patrol', REPORT: 'report' };

const LinkItem = ({ item, to, type }) => {
  const map = useContext(MapContext);
  const analytics = useContext(TrackerContext);

  const onClick = useCallback(() => {
    analytics?.track(`Navigate to ${type} from links section`);
  }, [analytics, type]);

  if (type === LINK_TYPES.PATROL) {
    if (ENABLE_PATROL_NEW_UI) {
      return <Link className={styles.link} onClick={onClick} to={to}>
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
