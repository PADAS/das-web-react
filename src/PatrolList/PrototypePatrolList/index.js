import React, { memo, useEffect, useState } from 'react';

import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';

import useNavigate from '../../hooks/useNavigate';
import { TAB_KEYS } from '../../constants';
import PatrolTypeIcon, { hasBuiltInPBadge } from '../../PatrolTypeIcon';
import { ReactComponent as PhoneIphoneIcon } from '../../common/images/icons/phone-iphone.svg';
import { ReactComponent as TracksOffIcon } from '../../common/images/icons/tracks_off.svg';
import { ReactComponent as PlaceIcon } from '../../common/images/icons/place.svg';

import { getUserPatrols, subscribeUserPatrols } from '../userPatrolsStore';
import { getPatrolStateEntry, subscribePatrolState } from '../../PatrolOverview/patrolStateStore';
import { seedDemoPatrolsOnce } from '../demoPatrols';

import * as styles from './styles.module.scss';

// The patrol list is driven entirely by the demo data (seeded at module
// load) + any patrols the user creates. The previous static example rows
// were removed once the demo dataset covered the same visual states.
const EXAMPLE_PATROLS = [];

const STATE_CLASSES = {
  overduePink: styles.stateOverduePink,
  overdueMagenta: styles.stateOverdueMagenta,
  ready: styles.stateReady,
  paused: styles.statePaused,
  active: styles.stateActive,
  scheduled: styles.stateScheduled,
  done: styles.stateDone,
  cancelled: styles.stateCancelled,
};

const PatrolRow = ({ item, onClick }) => {
  const stateClass = STATE_CLASSES[item.state] || '';
  return <li className={`${styles.row} ${stateClass}`}>
    <button
      type="button"
      className={styles.rowButton}
      onClick={onClick}
    >
      <span className={styles.iconBlock}>
        <PatrolTypeIcon
          patrolType={item.patrolType}
          className={styles.patrolIcon}
        />
        {!hasBuiltInPBadge(item.patrolType) && <span className={styles.pBadge}>P</span>}
      </span>

      <span className={styles.body}>
        <span className={styles.bodyLeft}>
          <span className={styles.titleLine}>
            <span className={styles.serial}>{item.serial}</span>
            <span className={styles.title}>{item.title}</span>
            {item.titleBadge === 'phone' && (
              <PhoneIphoneIcon className={styles.titleBadgeIcon} />
            )}
          </span>
          <span className={styles.subtitle}>{item.sub}</span>
        </span>

        <span className={styles.bodyRight}>
          <span className={styles.statusLine}>
            <span className={styles.statusLabel}>{item.statusLabel}</span>
          </span>
          <span className={styles.statusSub}>{item.statusSub}</span>
        </span>

        <span className={styles.actions}>
          {item.action && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={(e) => e.stopPropagation()}
            >
              {item.action}
            </button>
          )}
          {item.showActions && <>
            <span className={styles.iconButton} aria-hidden="true">
              <TracksOffIcon />
            </span>
            <span className={styles.iconButton} aria-hidden="true">
              <PlaceIcon />
            </span>
          </>}
          <span className={styles.kebab} aria-hidden="true">
            <MoreVertOutlinedIcon />
          </span>
        </span>
      </span>
    </button>
  </li>;
};

// Map patrolStateStore values → the row variant + status label.
const STATE_TO_VARIANT = {
  Active: { variant: 'active', label: 'Active' },
  Paused: { variant: 'paused', label: 'Paused' },
  Done: { variant: 'done', label: 'Done' },
  Cancelled: { variant: 'cancelled', label: 'Cancelled' },
  Overdue: { variant: 'overduePink', label: 'Overdue' },
};

const PrototypePatrolList = () => {
  const navigate = useNavigate();
  const [, force] = useState(0);
  useEffect(() => { seedDemoPatrolsOnce(); }, []);
  useEffect(() => subscribeUserPatrols(() => force((v) => v + 1)), []);
  useEffect(() => subscribePatrolState(() => force((v) => v + 1)), []);

  const userPatrols = getUserPatrols();

  // Render user-created patrols at the top of the list. The row variant
  // (purple Active / yellow Paused / gray Done / Cancelled) is driven by the
  // patrolStateStore so state changes from the overview reflect here too.
  const userRows = userPatrols.map((p) => {
    const startedAt = p.startedAt instanceof Date ? p.startedAt : new Date(p.startedAt);
    const dateLabel = startedAt.toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: '2-digit',
      hour: 'numeric', minute: '2-digit', hour12: false,
    });
    const { state } = getPatrolStateEntry(p.id);
    const { variant, label } = STATE_TO_VARIANT[state] || STATE_TO_VARIANT.Active;
    const isTerminal = state === 'Done' || state === 'Cancelled';
    return {
      id: p.id,
      patrolType: p.patrolType,
      state: variant,
      serial: p.serial,
      title: p.title,
      titleBadge: p.mobileOrigin ? 'phone' : undefined,
      sub: `0min | 0km`,
      statusLabel: label,
      statusSub: dateLabel,
      showActions: !isTerminal,
      action: state === 'Paused' ? 'Resume' : (state === 'Cancelled' ? 'Restore' : null),
      _userId: p.id,
    };
  });

  const allRows = [...userRows, ...EXAMPLE_PATROLS];

  return <ul className={styles.list} aria-label="Patrols">
    {allRows.map((item) => (
      <PatrolRow
        key={item.id}
        item={item}
        onClick={() => {
          if (item._userId) navigate(`/${TAB_KEYS.PATROLS}/${item._userId}`);
        }}
      />
    ))}
  </ul>;
};

export default memo(PrototypePatrolList);
