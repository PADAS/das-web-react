import React, { memo, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowRightFromLineIcon } from '../../../../../common/images/icons/arrow-right-from-line.svg';
import { ReactComponent as ChevronRightIcon } from '../../../../../common/images/icons/chevron-right.svg';
import { ReactComponent as FitScreenIcon } from '../../../../../common/images/icons/fit-screen.svg';

import {
  canPatrolTakeNewLegs,
  displayEndTimeForPatrolSegment,
  displayNameForPatrolSegment,
  displayNumberForPatrolSegment,
  displayStartTimeForPatrolSegment,
  getBoundsForPatrolSegment,
  hasPatrolSegmentNotRun,
  isPatrolSegmentAPause,
  scheduledEndTimeForPatrolSegment,
} from '../../../../../utils/patrols';
import { EMPTY_VALUE, PATROL_UI_STATES, TAB_KEYS } from '../../../../../constants';
import { format, STANDARD_DATE_FORMAT } from '../../../../../utils/datetime';
import { selectPatrolSegmentsTrackData, selectTrackedSubjectsPerPatrolSegment } from '../../../../../selectors/patrols';
import { TrackerContext } from '../../../../../utils/analytics';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';
import useNavigate from '../../../../../hooks/useNavigate';
import { usePatrolsPermissions } from '../../../../../hooks/usePermissions';

import Link from '../../../../../Link';
import StatusPill from '../../../StatusPill';
import TeamAndTracking from './TeamAndTracking';

import * as styles from './styles.module.scss';

const SIMPLIFIED_DATE_FORMAT = 'MM/dd/yyyy HH:mm';

// A pause is numbered among the pauses, so what a label calls a row changes
// with the kind of segment it shows.
const labelKeyForLeg = (leg, labelKey) => `${labelKey}.${leg.isPause ? 'pause' : 'leg'}`;

const ROW_CONTROL_SELECTOR = 'a, button, input';

const Legs = ({ patrol, patrolState }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.legs' });

  const tracker = useContext(TrackerContext);

  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();
  const jumpToLocation = useJumpToLocation();

  const patrolSegmentsTrackData = useSelector((state) => selectPatrolSegmentsTrackData(state, patrol));
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const trackedSubjectsPerPatrolSegment = useSelector(
    (state) => selectTrackedSubjectsPerPatrolSegment(state, patrol)
  );

  const canAddLeg = hasPatrolsUpdatePermission && canPatrolTakeNewLegs(patrol, patrolState);

  // Not memoized: a leg reads the clock, and this component only renders when
  // the patrol, its state or its tracks have moved anyway.
  const legs = patrol.patrol_segments.map((patrolSegment, index) => {
    const hasNotRun = hasPatrolSegmentNotRun(patrol, patrolSegment);

    return {
      bbox: getBoundsForPatrolSegment(patrolSegment, patrolSegmentsTrackData[index]),
      end: hasNotRun ? scheduledEndTimeForPatrolSegment(patrolSegment) : displayEndTimeForPatrolSegment(patrolSegment),
      hasNotRun,
      id: patrolSegment.id,
      isPause: isPatrolSegmentAPause(patrolSegment),
      number: displayNumberForPatrolSegment(patrol.patrol_segments, index),
      overviewPath: `/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${patrolSegment.id}`,
      patrolTypeDisplay: displayNameForPatrolSegment(patrolTypes, patrolSegment),
      start: displayStartTimeForPatrolSegment(patrolSegment),
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

  return <>
    <div className={`${styles.legTableWrapper} ${canAddLeg ? '' : styles.withoutNewLegButton}`}>
      <table className={styles.legTable}>
        <caption className="sr-only">{t('legTableCaption')}</caption>

        <thead>
          <tr>
            <th scope="col">{t('legColumnHeader')}</th>

            <th scope="col">{t('patrolTypeColumnHeader')}</th>

            <th scope="col">{t('startColumnHeader')}</th>

            <th scope="col">{t('endColumnHeader')}</th>

            <th scope="col">{t('teamColumnHeader')}</th>

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
            {leg.isPause
              ? <td colSpan={2}>
                <StatusPill className={styles.pausePill} state={PATROL_UI_STATES.PAUSED} />

                {!!leg.hasNotRun && <span className="sr-only">{t('legDidNotRunLabel')}</span>}
              </td>
              : <>
                <td>
                  {leg.number}

                  {!!leg.hasNotRun && <span className="sr-only">{t('legDidNotRunLabel')}</span>}
                </td>

                <td>{leg.patrolTypeDisplay}</td>
              </>}

            <td>{renderLegDate(leg.start)}</td>

            <td>{renderLegDate(leg.end)}</td>

            {/* A pause tracks nothing and covers no ground: the team that sat
                it out belongs to the legs either side of it. */}
            <td>
              {!leg.isPause
                && <TeamAndTracking legNumber={leg.number} trackedSubjects={leg.trackedSubjects} />}
            </td>

            <td>
              <div className={styles.legActionsColumn}>
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
