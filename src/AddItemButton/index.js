import React, { createContext, memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { selectCreatableEventTypesByCategory } from '../selectors/event-types';
import { SYSTEM_CONFIG_FLAGS } from '../constants';
import { trackEvent } from '../utils/analytics';
import { usePatrolsPermissions } from '../hooks/usePermissions';

import AddItemModal from './AddItemModal';
import DelayedUnmount from '../DelayedUnmount';

import * as styles from './styles.module.scss';

export const AddItemContext = createContext();

const AddItemButton = ({
  analyticsMetadata = { category: 'Feed', location: null },
  className = '',
  formProps = {
    hidePatrols: false,
    isPatrolReport: false,
    onSaveError: null,
    onSaveSuccess: null,
    relationshipButtonDisabled: false,
  },
  hideAddPatrolTab = false,
  hideAddEventTab = false,
  iconComponent = <AddButtonIcon />,
  modalProps = {},
  onAddPatrol = null,
  onAddReport = null,
  patrolData = {},
  reportData = {},
  showLabel = true,
  title = null,
  variant = 'primary',
  ...restProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton' });

  const eventsByCategory = useSelector(selectCreatableEventTypesByCategory);
  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);
  const patrolManagementEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const { hasPatrolsCreatePermission } = usePatrolsPermissions();

  const [showModal, setShowModal] = useState(false);

  const canCreateEvents = eventsEnabled && eventsByCategory?.length > 0;
  const canCreatePatrols = patrolManagementEnabled && hasPatrolsCreatePermission && patrolTypes.length > 0;

  const onClick = useCallback(() => {
    setShowModal(true);

    trackEvent(
      analyticsMetadata.category,
      `Click 'Add Report'${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [analyticsMetadata.category, analyticsMetadata.location]);

  return (canCreateEvents || canCreatePatrols) ? <AddItemContext.Provider
      value={{
        analyticsMetadata,
        formProps,
        hideAddPatrolTab: hideAddPatrolTab || !canCreatePatrols,
        hideAddEventTab: hideAddEventTab || !canCreateEvents,
        onAddPatrol,
        onAddReport,
        patrolData,
        reportData,
      }}
    >
    <DelayedUnmount isMounted={showModal}>
      <AddItemModal {...modalProps} onHide={() => setShowModal(false)} show={showModal} />
    </DelayedUnmount>

    <button
      aria-label={t('defaultLabel')}
      className={`${styles[`addItemButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`] ?? ''} ${className}`.trim()}
      data-testid="addItemButton"
      onClick={onClick}
      title={title || t('defaultTitle')}
      type="button"
      {...restProps}
    >
      {iconComponent}

      {showLabel && <label>{title || t('defaultTitle')}</label>}
    </button>
  </AddItemContext.Provider> : null;
};

export default memo(AddItemButton);
