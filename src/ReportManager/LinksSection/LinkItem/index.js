import React, { memo, useContext } from 'react';
// TODO: Replace with custom link after ERA-8169
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { openModalForPatrol } from '../../../utils/patrols';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../../constants';
import { MapContext } from '../../../App';

import PatrolListItem from '../../../PatrolListItem';
import ReportListItem from '../../../ReportListItem';

import styles from './styles.module.scss';

const { ENABLE_PATROL_NEW_UI } = DEVELOPMENT_FEATURE_FLAGS;

const LINK_TYPES = { PATROL: 'patrol', REPORT: 'report' };

const LinkItem = ({ item, type }) => {
  const map = useContext(MapContext);

  if (type === LINK_TYPES.PATROL) {
    if (ENABLE_PATROL_NEW_UI) {
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
      return <div style={{ cursor: 'pointer' }} onClick={() => openModalForPatrol(item, map)}>
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
    return <Link className={styles.link} to={`/${TAB_KEYS.REPORTS}/${item.id}`}>
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
