import React, { createContext, memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { selectCreatableEventTypesByCategory } from '../selectors/event-types';
import { trackEvent } from '../utils/analytics';
import { useEventsPermissions, usePatrolsPermissions } from '../hooks/usePermissions';

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
  hideAddReportTab = false,
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
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const { hasEventsCreatePermission } = useEventsPermissions();
  const { hasPatrolsCreatePermission } = usePatrolsPermissions();

  const [showModal, setShowModal] = useState(false);

  const onClick = useCallback(() => {
    setShowModal(true);

    trackEvent(
      analyticsMetadata.category,
      `Click 'Add Report'${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [analyticsMetadata.category, analyticsMetadata.location]);

  return (hasEventsCreatePermission || hasPatrolsCreatePermission) ? <AddItemContext.Provider
      value={{
        analyticsMetadata,
        formProps,
        hideAddPatrolTab,
        hideAddReportTab,
        onAddPatrol,
        onAddReport,
        patrolData,
        reportData,
      }}
    >
    <DelayedUnmount isMounted={showModal}>
      <AddItemModal {...modalProps} onHide={() => setShowModal(false)} show={showModal} />
    </DelayedUnmount>

    {(eventsByCategory?.length || patrolTypes?.length) ? <button
      aria-label={t('defaultLabel')}
      className={`${styles[`addItemButton-${variant}`]} ${className}`}
      data-testid="addItemButton"
      onClick={onClick}
      title={title || t('defaultTitle')}
      type="button"
      {...restProps}
    >
      {iconComponent}

      {showLabel && <label>{title || t('defaultTitle')}</label>}
    </button> : null}
  </AddItemContext.Provider> : null;
};

export default memo(AddItemButton);
