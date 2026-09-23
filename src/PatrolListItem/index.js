import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import { shallowEqual, useSelector } from 'react-redux';

import { EMPTY_VALUE } from '../constants';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { formatDistanceInKilometers } from '../utils/distance';
import { PATROL_LIST_ITEM_CATEGORY, trackEventFactory } from '../utils/analytics';
import { selectPatrolMeasuredSubjectIds } from '../selectors/patrols';
import usePatrol from '../hooks/usePatrol';

import SvgIcon from '../SvgIcon';
import FeedListItem from '../FeedListItem';
import PatrolMenu from '../PatrolMenu';
import PatrolTrackControls from '../PatrolTrackControls';

import * as styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const TRACK_FETCH_DEBOUNCE_DELAY = 150;

const PatrolListItem = ({
  className,
  dispatch: _dispatch,
  onClick = null,
  patrol,
  ref,
  showControls = true,
  showStateTitle = true,
  showTitleDetails = true,
  ...rest
}) => {
  const {
    patrolLeadSumDistance,

    isPatrolCancelled,
    isPatrolDone,
    isPatrolScheduled,
    isPatrolUnderWay,

    actualEndTime,
    actualStartTime,
    displayTitle,
    patrolElapsedTime,
    patrolIconId,
    patrolState,
    scheduledStartTime,
    theme,

    dateComponentDateString,

    onPatrolChange,
    restorePatrol,
    startPatrol,
  } = usePatrol(patrol);

  // The row reports only the patrol's distance, so it fetches what that is read
  // from. Its identity has to hold, or the debounce below never settles.
  const patrolMeasuredSubjectIds = useSelector(
    (state) => selectPatrolMeasuredSubjectIds(state, patrol),
    shallowEqual
  );

  const debouncedTrackFetch = useRef(null);
  const { t } = useTranslation('patrols');
  const { t: tUtils } = useTranslation('utils');
  const isPatrolUnderWayOrDone = isPatrolUnderWay || isPatrolDone;

  const { base: themeColor, background: themeBgColor } = theme;

  const handleClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item');

    onClick?.(patrol);
  }, [onClick, patrol]);

  const TitleDetailsComponent = useMemo(() => {
    if (isPatrolUnderWayOrDone) {
      return <span className={styles.titleDetails}>
        <span>{patrolElapsedTime}</span> | <span>
          {patrolLeadSumDistance == null
            ? EMPTY_VALUE
            : formatDistanceInKilometers(tUtils, patrolLeadSumDistance)}
        </span>
      </span>;
    }

    if (isPatrolScheduled || isPatrolCancelled) {
      return <span className={styles.titleDetails}>
        {t('patrolListItem.scheduledTitle')}<span>{scheduledStartTime}</span>
      </span>;
    }

    return null;
  }, [
    isPatrolCancelled,
    isPatrolScheduled,
    isPatrolUnderWayOrDone,
    patrolElapsedTime,
    patrolLeadSumDistance,
    scheduledStartTime,
    t,
    tUtils,
  ]);

  const onLocationClick = useCallback(() => {
    patrolListItemTracker.track('Click "jump to location" from patrol list item');
  }, []);

  const restorePatrolAndTrack = useCallback(() => {
    patrolListItemTracker.track('Restore patrol from patrol list item');

    restorePatrol();
  }, [restorePatrol]);

  const startPatrolAndTrack = useCallback(() => {
    patrolListItemTracker.track('Start patrol from patrol list item');

    startPatrol();
  }, [startPatrol]);

  const renderStateDependentControls = () => {
    if (isPatrolUnderWayOrDone) {
      return <PatrolTrackControls patrol={patrol} onLocationClick={onLocationClick} />;
    }

    if (isPatrolCancelled) {
      return <Button
          data-testid={`patrol-list-item-restore-btn-${patrol.id}`}
          onClick={restorePatrolAndTrack}
          size="sm"
          variant="light"
          className={styles.stateDependantControl}
        >
        {t('patrolListItem.restoreButton')}
      </Button>;
    }

    if (isPatrolScheduled) {
      return <Button
          data-testid={`patrol-list-item-start-btn-${patrol.id}`}
          onClick={startPatrolAndTrack}
          size="sm"
          variant="light"
          className={styles.stateDependantControl}
        >
        {t('patrolListItem.startButton')}
      </Button>;
    }

    return null;
  };

  useEffect(() => {
    if (patrolMeasuredSubjectIds.length) {
      window.clearTimeout(debouncedTrackFetch.current);
      debouncedTrackFetch.current = setTimeout(() => {
        fetchTracksIfNecessary(patrolMeasuredSubjectIds, {
          optionalDateBoundaries: { since: actualStartTime, until: actualEndTime }
        });
      }, TRACK_FETCH_DEBOUNCE_DELAY);

      return () => window.clearTimeout(debouncedTrackFetch.current);
    }
  }, [actualEndTime, actualStartTime, patrolMeasuredSubjectIds]);

  const renderedControlsComponent = showControls
    ? <div className={styles.controls}>
      {renderStateDependentControls()}
      <PatrolMenu
        data-testid={`patrol-list-item-kebab-menu-${patrol.id}`}
        onPatrolChange={onPatrolChange}
        patrol={patrol}
        showPatrolPrintOption={false}
        className={styles.patrolMenu}
        isPatrolCancelled={isPatrolCancelled}
      />
    </div>
    : null;

  const renderedDateComponent = <div
      className={styles.statusInfo}
      data-testid={`patrol-list-item-date-status-${patrol.id}`}
    >
    {showStateTitle && <strong data-testid={`patrol-list-item-state-title-${patrol.id}`}>
      {t(`detailView.header.uiStateTitles.${patrolState.key}`)}
    </strong>
    }
    <span>{dateComponentDateString}</span>
  </div>;

  const renderedIconComponent = patrolIconId && <button
      className={styles.icon}
      data-testid={`patrol-list-item-icon-${patrol.id}`}
      title={displayTitle}
      type="button"
    >
    <SvgIcon iconId={patrolIconId} style={{ fill: theme.fontColor ? theme.fontColor : 'white' }} type="patrols" />
  </button>;

  const renderedTitleComponent = <>
    <span className={styles.serialNumber}>{patrol.serial_number}</span>
    <button
        className={styles.title}
        data-testid={`patrol-list-item-title-${patrol.id}`}
        title={displayTitle}
        type='button'
      >
      <span className={styles.mainTitle}>{displayTitle}</span>
      {showTitleDetails && TitleDetailsComponent}
    </button>
  </>;

  return <FeedListItem
    className={`${styles.item} ${className}`}
    ControlsComponent={renderedControlsComponent}
    DateComponent={renderedDateComponent}
    IconComponent={renderedIconComponent}
    onClick={handleClick}
    ref={ref}
    themeBgColor={themeBgColor}
    themeColor={themeColor}
    title={displayTitle}
    TitleComponent={renderedTitleComponent}
    {...rest}
  />;
};

export default memo(PatrolListItem);
