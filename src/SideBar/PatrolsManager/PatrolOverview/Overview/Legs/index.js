import React, { useMemo } from 'react';
import { bbox, featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowRightFromLineIcon } from '../../../../../common/images/icons/arrow-right-from-line.svg';
import { ReactComponent as ChevronRightIcon } from '../../../../../common/images/icons/chevron-right.svg';
import { ReactComponent as FitScreenIcon } from '../../../../../common/images/icons/fit-screen.svg';

import {
  displayEndTimeForPatrolSegment,
  displayNameForPatrolType,
  displayStartTimeForPatrolSegment,
} from '../../../../../utils/patrols';
import { format, STANDARD_DATE_FORMAT } from '../../../../../utils/datetime';
import { selectPatrolTrackData } from '../../../../../selectors/patrols';
import { TAB_KEYS } from '../../../../../constants';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';
import useNavigate from '../../../../../hooks/useNavigate';

import Link from '../../../../../Link';

import * as styles from './styles.module.scss';

// TODO: Team and tracking assignments aren't part of the patrol segment data
// model yet.
const TEAM_PLACEHOLDER = 'Maya Chen +1';

const SIMPLIFIED_DATE_FORMAT = 'MM/dd/yyyy HH:mm';

const formatLegDate = (date, dateFormat) => date ? format(date, dateFormat) : null;

const Legs = ({ patrol }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.legs' });

  const jumpToLocation = useJumpToLocation();

  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const legs = useMemo(() => patrol.patrol_segments.map((segment, index) => {
    const legTrackData = patrolTrackData.legsTrackData?.[index] ?? null;
    const legTrackFeatures = (legTrackData?.track?.features ?? []).filter(
      (feature) => feature.geometry?.coordinates?.length
    );

    return {
      bbox: legTrackFeatures.length ? bbox(featureCollection(legTrackFeatures)) : null,
      end: displayEndTimeForPatrolSegment(segment),
      id: segment.id,
      number: index + 1,
      overviewPath: `/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${segment.id}`,
      patrolTypeDisplay: displayNameForPatrolType(patrolTypes, segment.patrol_type),
      start: displayStartTimeForPatrolSegment(segment),
    };
  }), [patrol, patrolTrackData, patrolTypes]);

  const onClickZoomToLegBounds = (leg) => (event) => {
    event.stopPropagation();

    if (leg.bbox) {
      jumpToLocation([[leg.bbox[0], leg.bbox[1]], [leg.bbox[2], leg.bbox[3]]], undefined, { maxZoom: 17 });
    }
  };

  return <>
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
        {legs.map((leg) => <tr className={styles.legRow} key={leg.id} onClick={() => navigate(leg.overviewPath)}>
          <td>{leg.number}</td>

          <td>{leg.patrolTypeDisplay}</td>

          <td>
            <time dateTime={leg.start?.toISOString()}>
              <span className={styles.fullDate}>{formatLegDate(leg.start, STANDARD_DATE_FORMAT)}</span>

              <span className={styles.simplifiedDate}>{formatLegDate(leg.start, SIMPLIFIED_DATE_FORMAT)}</span>
            </time>
          </td>

          <td>
            <time dateTime={leg.end?.toISOString()}>
              <span className={styles.fullDate}>{formatLegDate(leg.end, STANDARD_DATE_FORMAT)}</span>

              <span className={styles.simplifiedDate}>{formatLegDate(leg.end, SIMPLIFIED_DATE_FORMAT)}</span>
            </time>
          </td>

          <td>
            {/* TODO: This cell should be a dropdown listing the leg's team and assets. */}
            <span className={styles.teamColumn}>
              {TEAM_PLACEHOLDER}

              <span aria-hidden="true" className={styles.teamCaret} />
            </span>
          </td>

          <td>
            <div className={styles.legActionsColumn}>
              <button
                aria-label={t('zoomToLegBoundsButtonLabel', { legNumber: leg.number })}
                className={styles.zoomToLegBoundsButton}
                disabled={!leg.bbox}
                onClick={onClickZoomToLegBounds(leg)}
                title={t('zoomToLegBoundsButtonLabel', { legNumber: leg.number })}
                type="button"
              >
                <FitScreenIcon aria-hidden="true" />
              </button>

              <Link
                aria-label={t('viewLegButtonLabel', { legNumber: leg.number })}
                className={styles.viewLegButton}
                onClick={(event) => event.stopPropagation()}
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

    <Link className={styles.newLegButton} to={`/${TAB_KEYS.PATROLS}/${patrol.id}/legs/new`}>
      <ArrowRightFromLineIcon aria-hidden="true" />

      {t('newLegButton')}
    </Link>
  </>;
};

export default Legs;
