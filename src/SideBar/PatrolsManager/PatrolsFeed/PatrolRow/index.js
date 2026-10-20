import { memo, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcTitleAndSubtitleForPatrol,
  displayNumberForPatrolSegment,
  displayStartTimeForPatrol,
  formatPatrolStateTitleDate,
  getCancellationTimeForPatrol,
  getIsMobilePatrol,
  governingPatrolSegment,
  iconIdForPatrolSegment,
  isPatrolSegmentAPause,
  isPatrolStateUnderWay,
  patrolStateDetailsEndTime,
  patrolStateDetailsOverdueStartTime,
} from '../../../../utils/patrols';
import { PATROL_UI_STATES, TAB_KEYS } from '../../../../constants';
import { TrackerContext } from '../../../../utils/analytics';
import useNavigate from '../../../../hooks/useNavigate';
import usePatrolState from '../../../../hooks/usePatrolState';

import Actions from './Actions';
import Details from './Details';
import Link from '../../../../Link';
import SvgIcon from '../../../../SvgIcon';

import * as styles from './styles.module.scss';

const { ACTIVE, CANCELLED, DONE, PAUSED, READY_TO_START, SCHEDULED, START_OVERDUE } = PATROL_UI_STATES;

// The title link opens the row's menu too; only buttons keep the browser's.
const CONTEXT_MENU_CONTROL_SELECTOR = 'button, input';
const ROW_CONTROL_SELECTOR = 'a, button, input';

// The row's controls act on it in place, and its menus open through portals
// from outside the row.
const isRowItselfTarget = (event, controlSelector) => event.currentTarget.contains(event.target)
  && !event.target.closest(controlSelector);

const displayStartDate = (patrol) => formatPatrolStateTitleDate(displayStartTimeForPatrol(patrol));

// An invalid patrol has no moment to report, so it is left out and shows none.
const STATUS_DATE_BY_PATROL_STATE = {
  [ACTIVE.key]: displayStartDate,
  [CANCELLED.key]: (patrol) => formatPatrolStateTitleDate(getCancellationTimeForPatrol(patrol)),
  [DONE.key]: patrolStateDetailsEndTime,
  [PAUSED.key]: displayStartDate,
  [READY_TO_START.key]: displayStartDate,
  [SCHEDULED.key]: displayStartDate,
  [START_OVERDUE.key]: patrolStateDetailsOverdueStartTime,
};

const PatrolRow = ({ patrol }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolsFeed.patrolRow' });
  const { t: tStatusPill } = useTranslation('patrols', { keyPrefix: 'statusPill' });

  const navigate = useNavigate();
  const patrolState = usePatrolState(patrol);

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const tracker = useContext(TrackerContext);

  const contextMenuRef = useRef(null);

  const governingSegment = governingPatrolSegment(patrol);

  const patrolPath = `/${TAB_KEYS.PATROLS}/${patrol.id}`;

  const title = calcTitleAndSubtitleForPatrol(patrol, patrolTypes).title;

  const isUnderWayOrDone = isPatrolStateUnderWay(patrolState) || patrolState === DONE;

  // A leg only earns a mention once the patrol is past its first one.
  const legNumber = governingSegment && !isPatrolSegmentAPause(governingSegment)
    ? displayNumberForPatrolSegment(patrol.patrol_segments, patrol.patrol_segments.indexOf(governingSegment))
    : null;

  const onClickRow = (event) => {
    if (isRowItselfTarget(event, ROW_CONTROL_SELECTOR)) {
      navigate(patrolPath);

      tracker.track('Open a patrol from the patrols feed');
    }
  };

  const onContextMenuRow = (event) => {
    if (isRowItselfTarget(event, CONTEXT_MENU_CONTROL_SELECTOR)) {
      contextMenuRef.current.open(event);
    }
  };

  return <li
    className={`${styles.patrolRow} ${styles[patrolState.key]}`}
    onClick={onClickRow}
    onContextMenu={onContextMenuRow}
  >
    <span aria-hidden="true" className={styles.icon}>
      <SvgIcon
        iconId={governingSegment ? iconIdForPatrolSegment(patrolTypes, governingSegment) : null}
        type="patrols"
      />
    </span>

    <span className={styles.serialNumber}>{patrol.serial_number}</span>

    <div className={styles.titleRow}>
      <Link className={styles.titleLink} title={title} to={patrolPath}>{title}</Link>

      {!!getIsMobilePatrol(patrol) && <span className={styles.provenancePill}>{t('mobileProvenanceLabel')}</span>}
    </div>

    {isUnderWayOrDone
      ? <Details className={styles.details} legNumber={legNumber} patrol={patrol} />
      : <p className={styles.details}>
        {t('scheduledLabel', { startTime: displayStartDate(patrol) })}
      </p>}

    <div className={styles.status}>
      <span className={styles.statusTitle}>{tStatusPill(`uiStateTitles.${patrolState.key}`)}</span>

      <span className={styles.statusDate}>{STATUS_DATE_BY_PATROL_STATE[patrolState.key]?.(patrol)}</span>
    </div>

    <Actions className={styles.actions} contextMenuRef={contextMenuRef} patrol={patrol} patrolState={patrolState} />
  </li>;
};

export default memo(PatrolRow);
