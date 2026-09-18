import React, { memo, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowRightFromLineIcon } from '../../../../../common/images/icons/arrow-right-from-line.svg';
import { ReactComponent as ChevronRightIcon } from '../../../../../common/images/icons/chevron-right.svg';
import { ReactComponent as FitScreenIcon } from '../../../../../common/images/icons/fit-screen.svg';

import {
  canPatrolTakeNewLegs,
  displayEndTimeForPatrolSegment,
  displayNameForPatrolType,
  displayStartTimeForPatrolSegment,
  getBoundsForPatrolSegment,
  hasPatrolSegmentNotRun,
  isPatrolSegmentAPause,
  scheduledEndTimeForPatrolSegment,
} from '../../../../../utils/patrols';
import { EMPTY_VALUE, PATROL_UI_STATES, TAB_KEYS } from '../../../../../constants';
import { format, STANDARD_DATE_FORMAT } from '../../../../../utils/datetime';
import { selectPatrolTrackData, selectTrackedSubjectsPerPatrolSegment } from '../../../../../selectors/patrols';
import { TrackerContext } from '../../../../../utils/analytics';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';
import useNavigate from '../../../../../hooks/useNavigate';
import { usePatrolsPermissions } from '../../../../../hooks/usePermissions';

import Link from '../../../../../Link';
import StatusPill from '../../../StatusPill';
import TeamAndTracking from './TeamAndTracking';

import * as styles from './styles.module.scss';

const SIMPLIFIED_DATE_FORMAT = 'MM/dd/yyyy HH:mm';

const Legs = ({ patrol, patrolState }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.legs' });

  const tracker = useContext(TrackerContext);

  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();
  const jumpToLocation = useJumpToLocation();

  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const trackedSubjectsPerPatrolSegment = useSelector(
    (state) => selectTrackedSubjectsPerPatrolSegment(state, patrol)
  );

  const canAddLeg = hasPatrolsUpdatePermission && canPatrolTakeNewLegs(patrol, patrolState);

  // Not memoized: a leg reads the clock, and this component only renders when
  // the patrol, its state or its tracks have moved anyway.
  const legs = patrol.patrol_segments.map((segment, index) => {
    const hasNotRun = hasPatrolSegmentNotRun(patrol, segment);

    return {
      bbox: getBoundsForPatrolSegment(segment, patrolTrackData.legsTrackData?.[index]),
      end: hasNotRun ? scheduledEndTimeForPatrolSegment(segment) : displayEndTimeForPatrolSegment(segment),
      hasNotRun,
      id: segment.id,
      isPause: isPatrolSegmentAPause(segment),
      number: index + 1,
      overviewPath: `/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${segment.id}`,
      patrolTypeDisplay: displayNameForPatrolType(patrolTypes, segment.patrol_type),
      start: displayStartTimeForPatrolSegment(segment),
      trackedSubjects: trackedSubjectsPerPatrolSegment[index] ?? [],
    };
  });

  const onZoomToLegBounds = (leg) => (event) => {
    event.stopPropagation();

    jumpToLocation([[leg.bbox[0], leg.bbox[1]], [leg.bbox[2], leg.bbox[3]]], undefined, { maxZoom: 17 });

    tracker.track('Click "zoom to leg bounds" from patrol overview');
  };

  const onNavigateToLeg = (leg) => () => {
    navigate(leg.overviewPath);

    tracker.track('View leg from patrol overview');
  };

  const onViewLeg = (event) => {
    event.stopPropagation();

    tracker.track('View leg from patrol overview');
  };

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
            <td>
              {leg.number}

              {!!leg.hasNotRun && <span className="sr-only">{t('legDidNotRunLabel')}</span>}
            </td>

            <td>
              {leg.isPause
                ? <StatusPill className={styles.pausePill} state={PATROL_UI_STATES.PAUSED} />
                : leg.patrolTypeDisplay}
            </td>

            <td>{renderLegDate(leg.start)}</td>

            <td>{renderLegDate(leg.end)}</td>

            <td>
              <TeamAndTracking legNumber={leg.number} trackedSubjects={leg.trackedSubjects} />
            </td>

            <td>
              <div className={styles.legActionsColumn}>
                <button
                  aria-label={t('zoomToLegBoundsButtonLabel', { legNumber: leg.number })}
                  className={styles.zoomToLegBoundsButton}
                  disabled={!leg.bbox}
                  onClick={onZoomToLegBounds(leg)}
                  title={t('zoomToLegBoundsButtonLabel', { legNumber: leg.number })}
                  type="button"
                >
                  <FitScreenIcon aria-hidden="true" />
                </button>

                <Link
                  aria-label={t('viewLegButtonLabel', { legNumber: leg.number })}
                  className={styles.viewLegButton}
                  onClick={onViewLeg}
                  title={t('viewLegButtonLabel', { legNumber: leg.number })}
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
