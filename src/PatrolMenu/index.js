import React, { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { DAS_HOST, PATROL_UI_STATES, PATROL_API_STATES, PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { usePermissions } from '../hooks';
import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';
import { canEndPatrol, calcPatrolState } from '../utils/patrols';
import TextCopyBtn from '../TextCopyBtn';
import { basePrintingStyles } from '../utils/styles';
import KebabMenu from '../KebabMenu';
import { ReactComponent as PrinterIcon } from '../common/images/icons/printer-icon.svg';
import { ReactComponent as ClipIcon } from '../common/images/icons/link.svg';
import { ReactComponent as PlayIcon } from '../common/images/icons/play.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';

import styles from './styles.module.scss';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const PatrolMenu = ({
  patrol,
  onPatrolChange,
  menuRef,
  printableContentRef,
  patrolTitle,
  isPatrolCancelled,
  showPatrolPrintOption,
  className,
  ...rest
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolMenu' });

  const patrolState = calcPatrolState(patrol);

  const canEditPatrol = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.UPDATE);
  const patrolIsDone = useMemo(() => {
    return patrolState === PATROL_UI_STATES.DONE;
  }, [patrolState]);

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_UI_STATES.CANCELLED
  , [patrolState]);

  const canEnd = useMemo(() => canEndPatrol(patrol), [patrol]);

  const canRestorePatrol = useMemo(() => {
    return patrolState === PATROL_UI_STATES.DONE
    || patrolState === PATROL_UI_STATES.CANCELLED;
  }, [patrolState]);

  const canCancelPatrol = useMemo(() => {
    return !(patrolState === PATROL_UI_STATES.DONE
      || patrolState === PATROL_UI_STATES.CANCELLED);
  }, [patrolState]);

  const patrolStartEndCanBeToggled = useMemo(() => {
    return (patrolState === PATROL_UI_STATES.ACTIVE
      || patrolState === PATROL_UI_STATES.READY_TO_START
      || patrolState === PATROL_UI_STATES.SCHEDULED
      || patrolState === PATROL_UI_STATES.START_OVERDUE);
  }, [patrolState]);

  const patrolCancelRestoreCanBeToggled = useMemo(() => {
    return canRestorePatrol || canCancelPatrol;
  }, [canCancelPatrol, canRestorePatrol]);

  const patrolStartStopTitle = useMemo(() => {
    if (canEnd || patrolIsCancelled || patrolIsDone) return t('endPatrol');
    return t('startPatrol');
  }, [canEnd, patrolIsCancelled, patrolIsDone, t]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return t('restorePatrol');
    return t('cancelPatrol');
  }, [canRestorePatrol, t]);

  const togglePatrolCancellationState = useCallback(() => {
    patrolListItemTracker.track(`${canRestorePatrol ? 'Restore' : 'Cancel'} patrol from patrol list item kebab menu`);

    if (canRestorePatrol) {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.CANCELLED });
    }
  }, [canRestorePatrol, onPatrolChange]);

  const togglePatrolStartStopState = useCallback(() => {
    patrolListItemTracker.track(`${patrolStartStopTitle} from patrol list item kebab menu`);

    if (canEnd) {
      onPatrolChange({ state: PATROL_API_STATES.DONE, patrol_segments: [{ time_range: { end_time: new Date().toISOString() } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }] });
    }
  }, [canEnd, onPatrolChange, patrolStartStopTitle]);

  const handlePrint = useReactToPrint({
    content: () => printableContentRef.current,
    documentTitle: `${patrol.serial_number} ${patrolTitle} `,
    pageStyle: basePrintingStyles,
  });

  return <KebabMenu align='end' className={className} ref={menuRef} {...rest}>
    { (canEditPatrol && !isPatrolCancelled) &&
      <KebabMenu.Option disabled={!patrolStartEndCanBeToggled || patrolIsCancelled} onClick={togglePatrolStartStopState}>
        <PlayIcon />
        {patrolStartStopTitle}
      </KebabMenu.Option>
    }

    { (canEditPatrol && !isPatrolCancelled) &&
      <KebabMenu.Option disabled={!patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancellationState}>
        <CrossIcon />
        {patrolCancelRestoreTitle}
      </KebabMenu.Option>
    }

    { (!!patrol.id && !isPatrolCancelled) &&
      <KebabMenu.Option className={styles.copyBtn}>
        <TextCopyBtn
          label={t('copyButton')}
          text={`${DAS_HOST}/patrols/${patrol.id}`}
          icon={<ClipIcon />}
          successMessage={t('copyButtonMessage')}
          permitPropagation />
      </KebabMenu.Option>
    }

    { showPatrolPrintOption &&
      <KebabMenu.Option onClick={handlePrint}>
        <PrinterIcon />
        {t('printPatrolButton')}
      </KebabMenu.Option>
    }
  </KebabMenu>;
};

PatrolMenu.defaultProps = {
  patrolTitle: '',
  className: '',
  isPatrolCancelled: false,
  showPatrolPrintOption: true,
};

PatrolMenu.propTypes = {
  patrol: PropTypes.object.isRequired,
  patrolState: PropTypes.object,
  className: PropTypes.string,
  onPatrolChange: PropTypes.func.isRequired,
  patrolTitle: PropTypes.string,
  isPatrolCancelled: PropTypes.bool,
  showPatrolPrintOption: PropTypes.bool,
};

export default memo(PatrolMenu);
