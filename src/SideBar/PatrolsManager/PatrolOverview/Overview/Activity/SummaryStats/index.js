import React, { memo, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../../../../../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as CheckIcon } from '../../../../../../common/images/icons/check-light.svg';
import { ReactComponent as StarIcon } from '../../../../../../common/images/icons/star.svg';

import {
  actualStartTimeForPatrol,
  effectiveEndTimeForPatrol,
  getElapsedTimeForPatrol,
  getPausedTimeForPatrol,
} from '../../../../../../utils/patrols';
import { calcUrlForImage } from '../../../../../../utils/img';
import { formatDistanceInKilometers } from '../../../../../../utils/distance';
import { longTermAbbreviatedDurationHumanizer } from '../../../../../../utils/datetime';
import { selectPatrolTrackedSubjects } from '../../../../../../selectors/patrols';
import { TrackerContext } from '../../../../../../utils/analytics';
import useCurrentTime from '../../../../../../hooks/useCurrentTime';

import * as styles from './styles.module.scss';

const ELAPSED_TIME_REFRESH_INTERVAL = 30_000;

const EMPTY_VALUE = '-';

const Stat = ({ label, value }) => <div className={styles.statItem}>
  <dt className={styles.statLabel}>{label}</dt>

  <dd className={styles.statValue}>{value}</dd>
</div>;

const SummaryStats = ({ eventCount, patrol }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.activity.summaryStats' });
  const { t: tDates } = useTranslation('dates');
  const { t: tUtils } = useTranslation('utils');

  const hasPatrolStarted = useMemo(() => !!actualStartTimeForPatrol(patrol), [patrol]);
  const patrolEndTime = useMemo(() => effectiveEndTimeForPatrol(patrol), [patrol]);

  const currentTime = useCurrentTime(hasPatrolStarted && !patrolEndTime ? ELAPSED_TIME_REFRESH_INTERVAL : null);

  const tracker = useContext(TrackerContext);

  const patrolTrackedSubjects = useSelector((state) => selectPatrolTrackedSubjects(state, patrol));

  const distanceSubjectMenuItemOptionRefs = useRef([]);
  const wasDistanceSubjectMenuOpen = useRef(false);

  const distanceSubjectMenuPopoverId = useId();

  const [distanceSubjectId, setDistanceSubjectId] = useState(null);
  const [distanceSubjectMenuAnchorEl, setDistanceSubjectMenuAnchorEl] = useState();
  const [isDistanceSubjectMenuOpen, setIsDistanceSubjectMenuOpen] = useState(false);

  const distanceSubject = patrolTrackedSubjects.find(({ subject }) => subject.id === distanceSubjectId)
    ?? patrolTrackedSubjects[0]
    ?? null;

  const distance = hasPatrolStarted && distanceSubject?.distance != null
    ? formatDistanceInKilometers(tUtils, distanceSubject.distance)
    : EMPTY_VALUE;

  const humanizeDuration = useMemo(() => longTermAbbreviatedDurationHumanizer(tDates), [tDates]);

  const { activeTime, duration, pausedTime } = useMemo(() => {
    const duration = getElapsedTimeForPatrol(patrol, currentTime);
    const pausedTime = getPausedTimeForPatrol(patrol, currentTime);

    return { activeTime: duration - pausedTime, duration, pausedTime };
  }, [currentTime, patrol]);

  const formatElapsedTime = (elapsedTime) => hasPatrolStarted ? humanizeDuration(elapsedTime) : EMPTY_VALUE;

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

    tracker.track('Select the subject of the distance stat in patrol overview');
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
        aria-controls={distanceSubjectMenuPopoverId}
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
            {patrolTrackedSubjects.map(({ isPatrolLeader, subject }, index) => <li
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
                {subject.id === distanceSubject.subject.id && <CheckIcon className={styles.checkIcon} />}

                {!!subject.image_url && <img alt="" className={styles.subjectIcon} src={calcUrlForImage(subject.image_url)} />}

                {subject.name}

                {isPatrolLeader && <>
                  <StarIcon aria-hidden="true" className={styles.patrolLeaderIcon} />

                  <span className="sr-only">{t('patrolLeaderIndicator')}</span>
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
