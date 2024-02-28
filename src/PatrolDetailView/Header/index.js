import React, { memo, useCallback, useMemo, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PlayIcon } from '../../common/images/icons/play.svg';

import { PATROL_DETAIL_VIEW_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { TAB_KEYS } from '../../constants';
import usePatrol from '../../hooks/usePatrol';

import DasIcon from '../../DasIcon';
import PatrolTrackControls from '../../PatrolTrackControls';
import PatrolDistanceCovered from '../../Patrols/DistanceCovered';
import PatrolMenu from '../../PatrolMenu';

import styles from './styles.module.scss';

const patrolDetailViewTracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

const Header = ({ onChangeTitle, patrol, setRedirectTo, printableContentRef }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'detailView.header' });

  const {
    patrolData,

    isPatrolActive,
    isPatrolCancelled,
    isPatrolDone,
    isPatrolOverdue,
    isPatrolScheduled,

    displayTitle,
    patrolElapsedTime,
    patrolIconId,
    patrolState,
    scheduledStartTime,
    theme,

    dateComponentDateString,

    onPatrolChange: onSavePatrolChange,
    restorePatrol,
    startPatrol,
  } = usePatrol(patrol);

  const titleInput = useRef();

  const isNewPatrol = !patrol.id;
  const title = patrol.title || displayTitle;

  const titleDetails = useMemo(() => {
    if (isPatrolActive || isPatrolDone) {
      return <span data-testid="patrol-drawer-header-details" className={`${styles.headerDetails} ${styles.overflowedEllipsisText}`}>
        {patrolElapsedTime}
        <span className={styles.distanceCovered}>
          <PatrolDistanceCovered patrolsData={[patrolData]} suffix=' km' />
        </span>
      </span>;
    }
    if (isPatrolScheduled || isPatrolCancelled) {
      return <span className={`${styles.scheduledStartTime} ${styles.overflowedEllipsisText}`} data-testid="patrol-drawer-header-details">
        {t('patrolSchedule', { scheduledStartTime })}
      </span>;
    }
    return null;
  }, [
    isPatrolActive,
    isPatrolDone,
    isPatrolCancelled,
    isPatrolScheduled,
    patrolData,
    patrolElapsedTime,
    scheduledStartTime,
    t,
  ]);

  const onTitleBlur = useCallback((event) => {
    if (!event.target.textContent) {
      titleInput.current.innerHTML = displayTitle;
    }

    patrolDetailViewTracker.track('Change title');

    onChangeTitle(event.target.textContent || displayTitle);
    event.target.scrollTop = 0;
  }, [displayTitle, onChangeTitle]);

  const onTitleFocus = useCallback((event) => window.getSelection().selectAllChildren(event.target), []);

  const restorePatrolAndTrack = useCallback(() => {
    restorePatrol();
    setRedirectTo(`/${TAB_KEYS.PATROLS}`);

    patrolDetailViewTracker.track('Restore patrol from patrol detail view header');
  }, [restorePatrol, setRedirectTo]);

  const startPatrolAndTrack = useCallback(() => {
    startPatrol();
    setRedirectTo(`/${TAB_KEYS.PATROLS}`);

    patrolDetailViewTracker.track('Start patrol from patrol detail view header');
  }, [setRedirectTo, startPatrol]);

  const onLocationClick = useCallback(() => {
    patrolDetailViewTracker.track('Click "jump to location" from patrol detail view');
  }, []);

  const onPatrolChange = useCallback((value) => {
    onSavePatrolChange(value);
    setRedirectTo(`/${TAB_KEYS.PATROLS}`);
  }, [onSavePatrolChange, setRedirectTo]);

  return <div className={styles.header} style={{ backgroundColor: !isNewPatrol ? theme.background : undefined }}>
    <div className={styles.icon} style={{ backgroundColor: !isNewPatrol ? theme.base : undefined }}>
      <DasIcon className={!isNewPatrol ? '' : 'newPatrol'} style={{ fill: theme.fontColor ? theme.fontColor : 'auto' }} type='events' iconId={patrolIconId}  />
    </div>

    <p className={styles.serialNumber}>{patrol.serial_number}</p>

    <div className={styles.titleAndDetails}>
      {title && <div
        className={`${styles.title} ${styles.overflowedEllipsisText}`}
        contentEditable
        data-testid="patrolDetailView-header-title"
        onBlur={onTitleBlur}
        onFocus={onTitleFocus}
        ref={titleInput}
        suppressContentEditableWarning
      >
        {title}
      </div>}

      {!isNewPatrol && titleDetails}
    </div>

    {!isNewPatrol && <div className={styles.description} data-testid="patrol-drawer-header-description">
      <span style={{ color: (theme?.fontColor ?? theme?.base) }}>
        {t(`uiStateTitles.${patrolState.key}`)}
      </span>

      <br />

      <span className={styles.date}>{dateComponentDateString}</span>
    </div>}

    {(isPatrolActive || isPatrolDone) && <PatrolTrackControls patrol={patrol} onLocationClick={onLocationClick} className={styles.patrolTrackControls}/>}

    {( (isPatrolScheduled || isPatrolOverdue) && !isNewPatrol ) && <Button
      className={`${styles.actionButton} ${styles.startPatrolButton}`}
      onClick={startPatrolAndTrack}
      type="button"
      variant="secondary"
    >
      <PlayIcon />
      {t('patrolStartButton')}
    </Button>}

    {isPatrolCancelled && <Button
      className={`${styles.actionButton} ${styles.restorePatrolButton}`}
      onClick={restorePatrolAndTrack}
      type="button"
      variant="secondary"
    >
      {t('patrolRestoreButton')}
    </Button>}

    {!isNewPatrol && <PatrolMenu
      isPatrolCancelled={isPatrolCancelled}
      onPatrolChange={onPatrolChange}
      patrol={patrol}
      patrolTitle={title}
      printableContentRef={printableContentRef}
      className={styles.patrolMenu}
    />}
  </div>;
};

Header.propTypes = {
  onChangeTitle: PropTypes.func.isRequired,
  patrol: PropTypes.object.isRequired,
};

export default memo(Header);
