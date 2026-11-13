import { memo, useContext, useId, useMemo, useState } from 'react';
import { isFuture } from 'date-fns';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../../../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as StarIcon } from '../../../../common/images/icons/star.svg';

import {
  actualStartTimeForPatrol,
  actualStartTimeForPatrolSegment,
  effectiveEndTimeForPatrol,
  effectiveEndTimeForPatrolSegment,
  getElapsedTimeForPatrol,
  getElapsedTimeForPatrolSegment,
  getPausedTimeForPatrol,
  hasPatrolBegun,
  isPatrolSegmentAPause,
} from '../../../../utils/patrols';
import { calcUrlForImage } from '../../../../utils/img';
import { EMPTY_VALUE } from '../../../../constants';
import { formatDistanceInKilometers } from '../../../../utils/distance';
import { longTermAbbreviatedDurationHumanizer } from '../../../../utils/datetime';
import {
  selectPatrolLeadSumDistance,
  selectPatrolSegmentTrackedSubjects,
  selectPatrolTrackedSubjects,
} from '../../../../selectors/patrols';
import { TrackerContext } from '../../../../utils/analytics';
import useCurrentTime from '../../../../hooks/useCurrentTime';
import useMenuToggle from '../../../../hooks/useMenuToggle';

import Menu from '../../../../Menu';
import SvgIcon from '../../../../SvgIcon';

import * as styles from './styles.module.scss';

const ELAPSED_TIME_REFRESH_INTERVAL = 30_000;

const LEG_LEAD_DISTANCE_OPTION_ID = 'legLead';

const Stat = ({ label, value }) => <div className={styles.statItem}>
  <dt className={styles.statLabel}>{label}</dt>

  <dd className={styles.statValue}>{value}</dd>
</div>;

const SummaryStats = ({ eventCount, patrol, patrolSegment = null }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'activity.summaryStats' });
  const { t: tDates } = useTranslation('dates');
  const { t: tUtils } = useTranslation('utils');

  const distanceMenuToggle = useMenuToggle();

  const endTimestamp = (patrolSegment
    ? effectiveEndTimeForPatrolSegment(patrol, patrolSegment)
    : effectiveEndTimeForPatrol(patrol))?.getTime() ?? null;
  const startTime = patrolSegment ? actualStartTimeForPatrolSegment(patrolSegment) : actualStartTimeForPatrol(patrol);

  // A leg planned ahead carries the time it is due to begin, so the time alone
  // does not say it has, and no leg begins before the patrol does.
  const hasStarted = hasPatrolBegun(patrol) && !!startTime && !isFuture(startTime);

  const currentTime = useCurrentTime(hasStarted && !endTimestamp ? ELAPSED_TIME_REFRESH_INTERVAL : null);

  const duration = patrolSegment
    ? getElapsedTimeForPatrolSegment(patrolSegment, endTimestamp ?? currentTime)
    : getElapsedTimeForPatrol(patrol, currentTime);

  // A pause is a leg of its own, so a leg holds none of one: it either is the
  // pause, and stood still throughout, or it ran.
  const legPausedTime = isPatrolSegmentAPause(patrolSegment) ? duration : 0;
  const pausedTime = patrolSegment ? legPausedTime : getPausedTimeForPatrol(patrol, currentTime);

  const activeTime = duration - pausedTime;

  const tracker = useContext(TrackerContext);

  const patrolLeadSumDistance = useSelector((state) => selectPatrolLeadSumDistance(state, patrol));
  const patrolTrackedSubjects = useSelector((state) => patrolSegment
    ? selectPatrolSegmentTrackedSubjects(state, patrol, patrolSegment)
    : selectPatrolTrackedSubjects(state, patrol));

  const legLeadOptionDescriptionId = useId();

  const [distanceOptionId, setDistanceOptionId] = useState(null);

  // A patrol hands over from lead to lead, so what it covered is each leg's
  // lead: adding the whole team would count one walk once per subject on it.
  const hasLegLeadOption = !patrolSegment && patrolTrackedSubjects.length > 0;

  const distanceOptions = useMemo(() => [
    ...(hasLegLeadOption ? [{
      description: t('legLeadOptionDescription'),
      distance: patrolLeadSumDistance,
      id: LEG_LEAD_DISTANCE_OPTION_ID,
      isTeamLead: false,
      name: t('legLeadOptionLabel', { count: patrol.patrol_segments.length }),
      subject: null,
    }] : []),
    ...patrolTrackedSubjects.map((patrolTrackedSubject) => ({
      description: null,
      distance: patrolTrackedSubject.distance,
      id: patrolTrackedSubject.subject.id,
      isTeamLead: patrolTrackedSubject.isTeamLead,
      name: patrolTrackedSubject.subject.name,
      subject: patrolTrackedSubject.subject,
    })),
  ], [
    hasLegLeadOption,
    patrol.patrol_segments.length,
    patrolLeadSumDistance,
    patrolTrackedSubjects,
    t,
  ]);

  // The leg leads come first, so they are what a patrol reads by default and a
  // leg falls back to its own lead.
  const distanceOption = distanceOptions.find((option) => option.id === distanceOptionId)
    ?? distanceOptions[0]
    ?? null;

  const distance = hasStarted && distanceOption?.distance != null
    ? formatDistanceInKilometers(tUtils, distanceOption.distance)
    : EMPTY_VALUE;

  const humanizeDuration = useMemo(() => longTermAbbreviatedDurationHumanizer(tDates), [tDates]);

  const formatElapsedTime = (elapsedTime) => hasStarted ? humanizeDuration(elapsedTime) : EMPTY_VALUE;

  const onDistanceMenuOptionClick = (optionId) => {
    setDistanceOptionId(optionId);

    tracker.track('Select what the distance stat covers');
  };

  const distanceLabel = distanceOption
    ? <>
      <button
        aria-label={t('distanceOptionButtonLabel', { option: distanceOption.name })}
        className={styles.distanceOptionButton}
        title={t('distanceOptionButtonLabel', { option: distanceOption.name })}
        type="button"
        {...distanceMenuToggle.toggleProps}
        >
        {t('distanceLabel')}

        <ArrowDownSmallIcon
          aria-hidden="true"
          className={`${styles.statLabelIcon} ${distanceMenuToggle.menuProps.show ? styles.open : ''}`}
        />
      </button>

      <Menu aria-label={t('distanceMenuLabel')} className={styles.distanceMenu} {...distanceMenuToggle.menuProps}>
        {distanceOptions.map((option) => <Menu.Option
          aria-checked={option.id === distanceOption.id}
          aria-describedby={option.description ? legLeadOptionDescriptionId : undefined}
          className={styles.distanceMenuOption}
          key={option.id}
          onClick={() => onDistanceMenuOptionClick(option.id)}
          role="menuitemradio"
          title={option.name}
        >
          {!!option.subject?.image_url && <span className={styles.subjectIcon}>
            <SvgIcon imageUrl={calcUrlForImage(option.subject.image_url)} type="subjects" />
          </span>}

          <span className={styles.labelWrapper}>
            <span className={styles.label}>{option.name}</span>

            {!!option.description && <span
              aria-hidden="true"
              className={styles.description}
              id={legLeadOptionDescriptionId}
            >
              {option.description}
            </span>}
          </span>

          {!!option.isTeamLead && <>
            <span aria-hidden="true" className={styles.teamLeadIcon}>
              <StarIcon />
            </span>

            <span className="sr-only">{t('teamLeadIndicator')}</span>
          </>}
        </Menu.Option>)}
      </Menu>
    </>
    : t('distanceLabel');

  return <dl className={styles.summaryStats}>
    <Stat label={t('durationLabel')} value={formatElapsedTime(duration)} />

    <Stat label={t('pausedTimeLabel')} value={formatElapsedTime(pausedTime)} />

    <Stat label={t('activeTimeLabel')} value={formatElapsedTime(activeTime)} />

    <Stat label={distanceLabel} value={distance} />

    <Stat label={t('eventsLabel')} value={eventCount} />
  </dl>;
};

export default memo(SummaryStats);
