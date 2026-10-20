import { memo, useContext, useMemo } from 'react';
import { isFuture } from 'date-fns';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowRightFromLineIcon } from '../../../../../common/images/icons/arrow-right-from-line.svg';
import { ReactComponent as ChevronRightIcon } from '../../../../../common/images/icons/chevron-right.svg';
import { ReactComponent as FitScreenIcon } from '../../../../../common/images/icons/fit-screen.svg';

import {
  calcPatrolSegmentState,
  canPatrolTakeNewLegs,
  displayEndTimeForPatrolSegment,
  displayNameForPatrolSegment,
  displayNumberForPatrolSegment,
  displayStartTimeForPatrolSegment,
  effectiveEndTimeForPatrolSegment,
  getBoundsForPatrolSegment,
  getElapsedTimeForPatrolSegment,
  hasPatrolSegmentNotRun,
  isPatrolSegmentAPause,
  scheduledEndTimeForPatrolSegment,
} from '../../../../../utils/patrols';
import { EMPTY_VALUE, PATROL_UI_STATES, TAB_KEYS } from '../../../../../constants';
import { format, longTermAbbreviatedDurationHumanizer, STANDARD_DATE_FORMAT } from '../../../../../utils/datetime';
import { selectPatrolSegmentsTrackData, selectTrackedSubjectsPerPatrolSegment } from '../../../../../selectors/patrols';
import { TrackerContext } from '../../../../../utils/analytics';
import useCurrentTime from '../../../../../hooks/useCurrentTime';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';
import useNavigate from '../../../../../hooks/useNavigate';
import { usePatrolsPermissions } from '../../../../../hooks/usePermissions';

import Link from '../../../../../Link';
import StatusPill from '../../../StatusPill';
import TeamAndTracking from './TeamAndTracking';

import * as styles from './styles.module.scss';

const { CANCELLED, DONE, INVALID, PAUSED } = PATROL_UI_STATES;

const LEG_STATE_REFRESH_INTERVAL = 30_000;

const OVER_PATROL_UI_STATES = [CANCELLED, DONE, INVALID];

const SIMPLIFIED_DATE_FORMAT = 'MM/dd/yyyy HH:mm';

// A pause is numbered among the pauses, so what a label calls a row changes
// with the kind of segment it shows.
const labelKeyForLeg = (leg, labelKey) => `${labelKey}.${leg.isPause ? 'pause' : 'leg'}`;

const ROW_CONTROL_SELECTOR = 'a, button, input';

const Legs = ({ patrol, patrolState }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.legs' });
  const { t: tDates } = useTranslation('dates');

  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();

  // Legs begin and hand over by themselves, which changes neither the patrol
  // nor its state, so the table follows the clock until the patrol is over.
  useCurrentTime(OVER_PATROL_UI_STATES.includes(patrolState) ? null : LEG_STATE_REFRESH_INTERVAL);

  const patrolSegmentsTrackData = useSelector((state) => selectPatrolSegmentsTrackData(state, patrol));
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const trackedSubjectsPerPatrolSegment = useSelector(
    (state) => selectTrackedSubjectsPerPatrolSegment(state, patrol)
  );

  const tracker = useContext(TrackerContext);

  const canAddLeg = hasPatrolsUpdatePermission && canPatrolTakeNewLegs(patrol, patrolState);

  const humanizeDuration = useMemo(() => longTermAbbreviatedDurationHumanizer(tDates), [tDates]);

  // Not memoized: a leg reads the clock.
  const legs = patrol.patrol_segments.map((patrolSegment, index) => {
    const hasNotRun = hasPatrolSegmentNotRun(patrol, patrolSegment);

    const end = hasNotRun
      ? scheduledEndTimeForPatrolSegment(patrolSegment)
      : displayEndTimeForPatrolSegment(patrolSegment);
    const start = displayStartTimeForPatrolSegment(patrolSegment);
    const state = calcPatrolSegmentState(patrol, patrolSegment);

    // A leg that ran its course is read by how long it took, not by its plan.
    const duration = state === DONE
      ? humanizeDuration(getElapsedTimeForPatrolSegment(
        patrolSegment,
        effectiveEndTimeForPatrolSegment(patrol, patrolSegment)?.getTime()
      ))
      : null;
    // A leg carries the times it is due to run at before it runs, so the
    // moment alone does not say it happened: only a time_range value past does.
    const isEndPlanned = !!end && (hasNotRun || !patrolSegment.time_range?.end_time || isFuture(end));
    const isStartPlanned = !!start && (!patrolSegment.time_range?.start_time || isFuture(start));

    return {
      bbox: getBoundsForPatrolSegment(patrolSegment, patrolSegmentsTrackData[index]),
      duration,
      end,
      hasNotRun,
      id: patrolSegment.id,
      isEndPlanned,
      isPause: isPatrolSegmentAPause(patrolSegment),
      isStartPlanned,
      number: displayNumberForPatrolSegment(patrol.patrol_segments, index),
      overviewPath: `/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${patrolSegment.id}`,
      patrolTypeDisplay: displayNameForPatrolSegment(patrolTypes, patrolSegment),
      start,
      state,
      trackedSubjects: trackedSubjectsPerPatrolSegment[index] ?? [],
    };
  });

  const onZoomToLegBounds = (leg) => () => {
    jumpToLocation([[leg.bbox[0], leg.bbox[1]], [leg.bbox[2], leg.bbox[3]]], undefined, { maxZoom: 17 });

    tracker.track('Click "zoom to leg bounds" from patrol overview');
  };

  const onNavigateToLeg = (leg) => (event) => {
    // The row opens the leg, but the controls it carries act on it in place,
    // and the team list opens through a portal from outside the row.
    const isRowItself = event.currentTarget.contains(event.target)
      && !event.target.closest(ROW_CONTROL_SELECTOR);

    if (isRowItself) {
      navigate(leg.overviewPath);

      tracker.track('View leg from patrol overview');
    }
  };

  const onViewLeg = () => tracker.track('View leg from patrol overview');

  const renderLegDate = (date) => date
    ? <time dateTime={date.toISOString()}>
      <span className={styles.fullDate}>{format(date, STANDARD_DATE_FORMAT)}</span>

      <span className={styles.simplifiedDate}>{format(date, SIMPLIFIED_DATE_FORMAT)}</span>
    </time>
    : EMPTY_VALUE;

  const renderScheduledIndicator = (isPlanned) => !!isPlanned && <span className={styles.secondaryLine}>
    <span className={styles.scheduledIndicator}>{t('scheduledIndicator')}</span>
  </span>;

  return <>
    <div className={`${styles.legTableWrapper} ${canAddLeg ? '' : styles.withoutNewLegButton}`}>
      <table className={styles.legTable}>
        <caption className="sr-only">{t('legTableCaption')}</caption>

        <thead>
          <tr>
            <th scope="col">{t('legColumnHeader')}</th>

            <th className={styles.patrolTypeColumn} scope="col">{t('patrolTypeColumnHeader')}</th>

            <th colSpan={3} scope="col">{t('startAndEndColumnHeader')}</th>

            <th className={styles.teamColumn} scope="col">{t('teamColumnHeader')}</th>

            <th scope="col">
              <span className="sr-only">{t('legActionsColumnHeader')}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {legs.map((leg) => <tr
              className={`${styles.legRow} ${leg.hasNotRun ? styles.notRunLeg : ''}`}
              key={leg.id}
              onClick={onNavigateToLeg(leg)}
            >
            {/* A pause is numbered among the pauses, so a number beside the
                legs' would read as a leg of its own. */}
            <td className={styles.legNumberColumn}>
              {!leg.isPause && leg.number}

              {!!leg.hasNotRun && <span className="sr-only">{t('legDidNotRunLabel')}</span>}
            </td>

            <td className={styles.patrolTypeColumn}>
              {leg.isPause
                ? <StatusPill className={styles.statePill} state={PAUSED} />
                : <>
                  <span className={styles.primaryLine}>{leg.patrolTypeDisplay}</span>

                  <span className={styles.secondaryLine}>
                    <StatusPill className={styles.statePill} state={leg.state} />
                  </span>
                </>}
            </td>

            <td className={styles.startColumn}>
              <span className={styles.primaryLine}>{renderLegDate(leg.start)}</span>

              {leg.duration
                ? <span className={styles.secondaryLine}>
                  <span className={styles.duration}>
                    <span className="sr-only">{t('durationLabel')} </span>

                    {leg.duration}
                  </span>
                </span>
                : renderScheduledIndicator(leg.isStartPlanned)}
            </td>

            {/* An open end is ordinary, so it is left blank, while a missing start
                keeps its dash: a row must never read as beginning at its end. */}
            <td className={styles.dateSeparatorColumn}>
              {!!leg.end && <span aria-hidden="true">-</span>}
            </td>

            <td className={styles.endColumn}>
              {!!leg.end && <>
                <span className={styles.primaryLine}>{renderLegDate(leg.end)}</span>

                {!leg.duration && renderScheduledIndicator(leg.isEndPlanned)}
              </>}
            </td>

            {/* A pause tracks nothing and covers no ground: the team that sat
                it out belongs to the legs either side of it. */}
            <td className={styles.teamColumn}>
              {!leg.isPause
                && <TeamAndTracking legNumber={leg.number} trackedSubjects={leg.trackedSubjects} />}
            </td>

            <td className={styles.legActionsColumn}>
              <div className={styles.legActions}>
                {!leg.isPause && <button
                  aria-label={t('zoomToLegBoundsButtonLabel', { number: leg.number })}
                  className={styles.zoomToLegBoundsButton}
                  disabled={!leg.bbox}
                  onClick={onZoomToLegBounds(leg)}
                  title={t('zoomToLegBoundsButtonLabel', { number: leg.number })}
                  type="button"
                >
                  <FitScreenIcon aria-hidden="true" />
                </button>}

                <Link
                  aria-label={t(labelKeyForLeg(leg, 'viewLegButtonLabel'), { number: leg.number })}
                  className={styles.viewLegButton}
                  onClick={onViewLeg}
                  title={t(labelKeyForLeg(leg, 'viewLegButtonLabel'), { number: leg.number })}
                  to={leg.overviewPath}
                >
                  <ChevronRightIcon aria-hidden="true" />
                </Link>
              </div>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>

    {!!canAddLeg && <Link
        className={styles.newLegButton}
        onClick={() => tracker.track('Click "add new leg" from patrol overview')}
        to={`/${TAB_KEYS.PATROLS}/${patrol.id}/legs/new`}
      >
      <ArrowRightFromLineIcon aria-hidden="true" />

      {t('newLegButton')}
    </Link>}
  </>;
};

export default memo(Legs);
