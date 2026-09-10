import React, { memo, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { isFuture } from 'date-fns';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../../../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as CheckIcon } from '../../../../common/images/icons/check-light.svg';
import { ReactComponent as StarIcon } from '../../../../common/images/icons/star.svg';

import {
  actualStartTimeForPatrol,
  actualStartTimeForPatrolSegment,
  effectiveEndTimeForPatrol,
  effectiveEndTimeForPatrolSegment,
  getElapsedTimeForPatrol,
  getElapsedTimeForPatrolSegment,
  getPausedTimeForPatrol,
  isPatrolSegmentAPause,
} from '../../../../utils/patrols';
import { calcUrlForImage } from '../../../../utils/img';
import { EMPTY_VALUE } from '../../../../constants';
import { formatDistanceInKilometers } from '../../../../utils/distance';
import { longTermAbbreviatedDurationHumanizer } from '../../../../utils/datetime';
import { selectPatrolSegmentTrackedSubjects, selectPatrolTrackedSubjects } from '../../../../selectors/patrols';
import { TrackerContext } from '../../../../utils/analytics';
import useCurrentTime from '../../../../hooks/useCurrentTime';

import SvgIcon from '../../../../SvgIcon';

import * as styles from './styles.module.scss';

const ELAPSED_TIME_REFRESH_INTERVAL = 30_000;

const Stat = ({ label, value }) => <div className={styles.statItem}>
  <dt className={styles.statLabel}>{label}</dt>

  <dd className={styles.statValue}>{value}</dd>
</div>;

const SummaryStats = ({ eventCount, patrol, patrolSegment = null }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'activity.summaryStats' });
  const { t: tDates } = useTranslation('dates');
  const { t: tUtils } = useTranslation('utils');

  const endTimestamp = (patrolSegment
    ? effectiveEndTimeForPatrolSegment(patrol, patrolSegment)
    : effectiveEndTimeForPatrol(patrol))?.getTime() ?? null;
  const startTime = patrolSegment ? actualStartTimeForPatrolSegment(patrolSegment) : actualStartTimeForPatrol(patrol);

  // A leg planned ahead carries the time it is due to begin, so the time alone
  // does not say it has.
  const hasStarted = !!startTime && !isFuture(startTime);

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

  const patrolTrackedSubjects = useSelector((state) => patrolSegment
    ? selectPatrolSegmentTrackedSubjects(state, patrol, patrolSegment)
    : selectPatrolTrackedSubjects(state, patrol));

  const distanceSubjectMenuItemOptionRefs = useRef([]);
  const wasDistanceSubjectMenuOpen = useRef(false);

  const distanceSubjectMenuPopoverId = useId();

  const [distanceSubjectId, setDistanceSubjectId] = useState(null);
  const [distanceSubjectMenuAnchorEl, setDistanceSubjectMenuAnchorEl] = useState();
  const [isDistanceSubjectMenuOpen, setIsDistanceSubjectMenuOpen] = useState(false);

  const distanceSubject = patrolTrackedSubjects.find(({ subject }) => subject.id === distanceSubjectId)
    ?? patrolTrackedSubjects[0]
    ?? null;

  const distance = hasStarted && distanceSubject?.distance != null
    ? formatDistanceInKilometers(tUtils, distanceSubject.distance)
    : EMPTY_VALUE;

  const humanizeDuration = useMemo(() => longTermAbbreviatedDurationHumanizer(tDates), [tDates]);

  const formatElapsedTime = (elapsedTime) => hasStarted ? humanizeDuration(elapsedTime) : EMPTY_VALUE;

  const onDistanceSubjectMenuClose = () => {
    setIsDistanceSubjectMenuOpen(false);

    distanceSubjectMenuAnchorEl?.focus();
  };

  const onDistanceSubjectMenuHide = () => {
    setIsDistanceSubjectMenuOpen(false);

    if (document.activeElement === document.body) {
      distanceSubjectMenuAnchorEl?.focus();
    }
  };

  const onDistanceSubjectMenuKeyDown = (event) => {
    // React leaves the slots of unmounted options behind, so only the mounted
    // ones can take focus.
    const menuItemOptions = distanceSubjectMenuItemOptionRefs.current.filter(Boolean);
    const currentOptionIndex = menuItemOptions.findIndex((option) => option === document.activeElement);

    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      menuItemOptions[(currentOptionIndex + 1) % menuItemOptions.length]?.focus();

      break;

    case 'ArrowUp':
      event.preventDefault();

      menuItemOptions[(currentOptionIndex - 1 + menuItemOptions.length) % menuItemOptions.length]?.focus();

      break;

    case 'End':
      event.preventDefault();

      menuItemOptions[menuItemOptions.length - 1]?.focus();

      break;

    case 'Home':
      event.preventDefault();

      menuItemOptions[0]?.focus();

      break;

    case 'Tab':
      onDistanceSubjectMenuClose();

      break;

    case 'Escape':
      event.preventDefault();

      onDistanceSubjectMenuClose();

      break;

    default:
    }
  };

  const onDistanceSubjectMenuOptionClick = (subjectId) => {
    setDistanceSubjectId(subjectId);

    onDistanceSubjectMenuClose();

    tracker.track('Select the subject of the distance stat');
  };

  useEffect(() => {
    const isDistanceSubjectMenuOpening = isDistanceSubjectMenuOpen && !wasDistanceSubjectMenuOpen.current;
    wasDistanceSubjectMenuOpen.current = isDistanceSubjectMenuOpen;

    if (isDistanceSubjectMenuOpening) {
      // Opening the menu focuses the checked subject menu item option.
      const checkedDistanceSubjectMenuItemOptionIndex = patrolTrackedSubjects.findIndex(
        ({ subject }) => subject.id === distanceSubject?.subject.id
      );
      distanceSubjectMenuItemOptionRefs.current[checkedDistanceSubjectMenuItemOptionIndex]?.focus();
    }
  }, [isDistanceSubjectMenuOpen, patrolTrackedSubjects, distanceSubject]);

  const distanceLabel = distanceSubject
    ? <>
      <button
        aria-controls={isDistanceSubjectMenuOpen ? distanceSubjectMenuPopoverId : undefined}
        aria-expanded={isDistanceSubjectMenuOpen}
        aria-haspopup="menu"
        aria-label={t('distanceSubjectButtonLabel', { subject: distanceSubject.subject.name })}
        className={styles.distanceSubjectButton}
        onClick={() => setIsDistanceSubjectMenuOpen((isOpen) => !isOpen)}
        ref={setDistanceSubjectMenuAnchorEl}
        title={t('distanceSubjectButtonLabel', { subject: distanceSubject.subject.name })}
        type="button"
        >
        {t('distanceLabel')}

        <ArrowDownSmallIcon aria-hidden="true" className={styles.statLabelIcon} />
      </button>

      <Overlay
        onHide={onDistanceSubjectMenuHide}
        placement="bottom-start"
        rootClose
        show={isDistanceSubjectMenuOpen}
        target={distanceSubjectMenuAnchorEl}
        >
        <Popover className={styles.distanceSubjectMenuPopover} role="presentation">
          <ul
            aria-label={t('distanceSubjectMenuLabel')}
            className={styles.distanceSubjectMenu}
            id={distanceSubjectMenuPopoverId}
            onKeyDown={onDistanceSubjectMenuKeyDown}
            role="menu"
          >
            {patrolTrackedSubjects.map(({ isTeamLead, subject }, index) => <li
              className={styles.distanceSubjectMenuItem}
              key={subject.id}
              role="none"
            >
              <button
                aria-checked={subject.id === distanceSubject.subject.id}
                className={styles.distanceSubjectMenuItemOption}
                onClick={() => onDistanceSubjectMenuOptionClick(subject.id)}
                ref={(element) => {
                  distanceSubjectMenuItemOptionRefs.current[index] = element;
                }}
                role="menuitemradio"
                tabIndex={-1}
                title={subject.name}
                type="button"
              >
                {subject.id === distanceSubject.subject.id && <CheckIcon aria-hidden="true" className={styles.checkIcon} />}

                {!!subject.image_url && <span className={styles.subjectIcon}>
                  <SvgIcon imageUrl={calcUrlForImage(subject.image_url)} type="subjects" />
                </span>}

                {subject.name}

                {!!isTeamLead && <>
                  <StarIcon aria-hidden="true" className={styles.teamLeadIcon} />

                  <span className="sr-only">{t('teamLeadIndicator')}</span>
                </>}
              </button>
            </li>)}
          </ul>
        </Popover>
      </Overlay>
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
