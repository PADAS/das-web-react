import React, { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useReactToPrint } from 'react-to-print';

import { DAS_HOST, PATROL_UI_STATES, PATROL_API_STATES, PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { usePermissions } from '../hooks';
import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';
import { canEndPatrol, calcPatrolState } from '../utils/patrols';
import TextCopyBtn from '../TextCopyBtn';
import { basePrintingStyles } from '../utils/styles';
import OptionsMenu, { Option } from '../OptionsMenu';

import styles from './styles.module.scss';
import { ReactComponent as PrinterIcon } from '../common/images/icons/printer-icon.svg';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const PatrolMenu = (props) => {
  const { patrol, onPatrolChange, menuRef, printableContentRef, patrolTitle, isPatrolCancelled, showPatrolPrintOption, ...rest } = props;

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
    if (canEnd || patrolIsCancelled || patrolIsDone) return 'End Patrol';
    return 'Start Patrol';
  }, [canEnd, patrolIsCancelled, patrolIsDone]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return 'Restore Patrol';
    return 'Cancel Patrol';
  }, [canRestorePatrol]);

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

  return  <OptionsMenu align='end' {...rest} ref={menuRef}>
    { (canEditPatrol && !isPatrolCancelled) && <Option disabled={!patrolStartEndCanBeToggled || patrolIsCancelled} onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</Option>}
    { (canEditPatrol && !isPatrolCancelled) && <Option disabled={!patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancellationState}>{patrolCancelRestoreTitle}</Option>}
    { (!!patrol.id && !isPatrolCancelled) && <Option className={styles.copyBtn}>
      <TextCopyBtn
          label='Copy patrol link'
          text={`${DAS_HOST}/patrols/${patrol.id}`}
          icon={null}
          successMessage='Link copied'
          permitPropagation
      />
    </Option>}
    { showPatrolPrintOption && <Option onClick={handlePrint}>
      <PrinterIcon />
      Print patrol
    </Option>}
  </OptionsMenu>;
};

export default memo(PatrolMenu);

PatrolMenu.defaultProps = {
  patrolTitle: '',
  isPatrolCancelled: false,
  showPatrolPrintOption: true,
};

PatrolMenu.propTypes = {
  patrol: PropTypes.object.isRequired,
  patrolState: PropTypes.object,
  onPatrolChange: PropTypes.func.isRequired,
  patrolTitle: PropTypes.string,
  isPatrolCancelled: PropTypes.bool,
  showPatrolPrintOption: PropTypes.bool,
};