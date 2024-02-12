import React, { memo, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { DAS_HOST, PATROL_UI_STATES, PATROL_API_STATES, PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { usePermissions } from '../hooks';
import KebabMenuIcon from '../KebabMenuIcon';
import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';
import { canEndPatrol, calcPatrolState } from '../utils/patrols';
import TextCopyBtn from '../TextCopyBtn';
import { basePrintingStyles } from '../utils/styles';

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

  const togglePatrolCancelationState = useCallback(() => {
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

  const onDropdownClick = useCallback((event) => event.stopPropagation(), []);

  const handlePrint = useReactToPrint({
    content: () => printableContentRef.current,
    documentTitle: `${patrol.serial_number} ${patrolTitle} `,
    pageStyle: basePrintingStyles,
  });

  useEffect(() => {
    const handleClickOutside = () => menuRef?.current?.classList.remove('show');
    window.addEventListener('click', handleClickOutside, true);

    return () => window.removeEventListener('click', handleClickOutside);
  }, [menuRef]);

  return <Dropdown align="end" className={`${styles.kebabMenu} ${className}`} {...rest} onClick={onDropdownClick}>
    <Dropdown.Toggle as="button" className={styles.kebabToggle} >
      <KebabMenuIcon />
    </Dropdown.Toggle>

    <Dropdown.Menu className={styles.menuDropdown} ref={menuRef}>
      {canEditPatrol && !isPatrolCancelled && <Dropdown.Item
        disabled={!patrolStartEndCanBeToggled || patrolIsCancelled}
        onClick={togglePatrolStartStopState}
      >
        {patrolStartStopTitle}
      </Dropdown.Item>}

      {canEditPatrol && !isPatrolCancelled && <Dropdown.Item
        disabled={!patrolCancelRestoreCanBeToggled}
        onClick={togglePatrolCancelationState}
      >
        {patrolCancelRestoreTitle}
      </Dropdown.Item>}

      {!!patrol.id && !isPatrolCancelled && <Dropdown.Item className={styles.copyBtn}>
        <TextCopyBtn
          icon={null}
          label={t('copyButton')}
          permitPropagation
          successMessage={t('copyButtonMessage')}
          text={`${DAS_HOST}/patrols/${patrol.id}`}
        />
      </Dropdown.Item>}

      {showPatrolPrintOption && <Dropdown.Item onClick={handlePrint}>
        {t('printPatrolButton')}
      </Dropdown.Item>}
    </Dropdown.Menu>
  </Dropdown>;
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
