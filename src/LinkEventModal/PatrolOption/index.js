import MoonLoader from 'react-spinners/MoonLoader';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcTitleAndSubtitleForPatrol,
  displayDurationForPatrol,
  displayNumberForPatrolSegment,
  displayStartTimeForPatrol,
  formatPatrolStateTitleDate,
  getCancellationTimeForPatrol,
  governingPatrolSegment,
  iconIdForPatrolSegment,
  isPatrolSegmentAPause,
  patrolStateDetailsEndTime,
} from '../../utils/patrols';
import { PATROL_UI_STATES } from '../../constants';
import usePatrolState from '../../hooks/usePatrolState';

import SvgIcon from '../../SvgIcon';

import * as styles from './styles.module.scss';

const { ACTIVE, CANCELLED, DONE, PAUSED } = PATROL_UI_STATES;

const ADD_LOADER_SIZE = 14;

const DETAIL_SEPARATOR = ' | ';

const displayStartDate = (patrol) => formatPatrolStateTitleDate(displayStartTimeForPatrol(patrol));

// Only a patrol that began can take an event, so no other state is listed.
const STATUS_DATE_BY_PATROL_STATE = {
  [ACTIVE.key]: displayStartDate,
  [CANCELLED.key]: (patrol) => formatPatrolStateTitleDate(getCancellationTimeForPatrol(patrol)),
  [DONE.key]: patrolStateDetailsEndTime,
  [PAUSED.key]: displayStartDate,
};

const PatrolOption = ({ isAdding = false, isDisabled = false, onAdd, patrol }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'linkEventModal.patrolOption' });
  const { t: tModal } = useTranslation('reports', { keyPrefix: 'linkEventModal' });
  const { t: tStatusPill } = useTranslation('patrols', { keyPrefix: 'statusPill' });

  const patrolState = usePatrolState(patrol);

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const governingSegment = governingPatrolSegment(patrol);
  const legNumber = governingSegment && !isPatrolSegmentAPause(governingSegment)
    ? displayNumberForPatrolSegment(patrol.patrol_segments, patrol.patrol_segments.indexOf(governingSegment))
    : null;
  const title = calcTitleAndSubtitleForPatrol(patrol, patrolTypes).title;

  return <li className={`${styles.patrolOption} ${styles[patrolState.key]}`}>
    <span aria-hidden="true" className={styles.icon}>
      <SvgIcon
        iconId={governingSegment ? iconIdForPatrolSegment(patrolTypes, governingSegment) : null}
        type="patrols"
      />
    </span>

    <span className={styles.serialNumber}>{patrol.serial_number}</span>

    <span className={styles.title} title={title}>{title}</span>

    <p className={styles.details}>
      {legNumber > 1 && <>{t('legLabel', { number: legNumber })}{DETAIL_SEPARATOR}</>}

      {displayDurationForPatrol(patrol)}
    </p>

    <div className={styles.status}>
      <span className={styles.statusTitle}>{tStatusPill(`uiStateTitles.${patrolState.key}`)}</span>

      <span className={styles.statusDate}>{STATUS_DATE_BY_PATROL_STATE[patrolState.key]?.(patrol)}</span>
    </div>

    <button
      aria-busy={isAdding}
      aria-disabled={isDisabled}
      aria-label={t('addButtonLabel', { serialNumber: patrol.serial_number, title })}
      className={styles.addButton}
      onClick={() => onAdd(patrol)}
      title={t('addButtonLabel', { serialNumber: patrol.serial_number, title })}
      type="button"
    >
      {isAdding ? <MoonLoader aria-hidden color="currentColor" size={ADD_LOADER_SIZE} /> : tModal('addButton')}
    </button>
  </li>;
};

export default PatrolOption;
