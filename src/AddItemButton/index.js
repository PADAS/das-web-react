import React, { createContext, memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { addReportFormProps } from '../proptypes';
import { trackEvent } from '../utils/analytics';
import { getUserCreatableEventTypesByCategory } from '../selectors';
import AddItemModal from './AddItemModal';
import DelayedUnmount from '../DelayedUnmount';

import styles from './styles.module.scss';

export const AddItemContext = createContext();

const AddItemButton = ({
  analyticsMetadata,
  className,
  formProps,
  hideAddPatrolTab,
  hideAddReportTab,
  iconComponent,
  modalProps,
  onAddPatrol,
  onAddReport,
  patrolData,
  reportData,
  showLabel,
  title,
  variant,
  ...rest
}) => {
  const [showModal, setShowModal] = useState(false);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const eventsByCategory = useSelector(getUserCreatableEventTypesByCategory);

  const onClick = useCallback(() => {
    setShowModal(true);

    trackEvent(
      analyticsMetadata.category,
      `Click 'Add Report' button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [analyticsMetadata.category, analyticsMetadata.location]);

  const onHideModal = useCallback(() => setShowModal(false), []);

  const addItemContextValue = {
    analyticsMetadata,
    formProps,
    hideAddPatrolTab,
    hideAddReportTab,
    onAddPatrol,
    onAddReport,
    patrolData,
    reportData,
  };

  return <AddItemContext.Provider value={addItemContextValue}>
    <DelayedUnmount isMounted={showModal}>
      <AddItemModal {...modalProps} onHide={onHideModal} show={showModal} />
    </DelayedUnmount>
    {
      (eventsByCategory?.length || patrolTypes?.length) ?
          (<button className={`${styles[`addItemButton-${variant}`]} ${className}`}
                   data-testid="addItemButton"
                   onClick={onClick}
                   title={title}
                   type="button"
                   {...rest}>
            {iconComponent}
            {showLabel && <label>{title}</label>}
          </button>)
          : null
    }
  </AddItemContext.Provider>;
};

AddItemButton.defaultProps = {
  analyticsMetadata: {
    category: 'Feed',
    location: null,
  },
  className: '',
  formProps: {
    hidePatrols: false,
    isPatrolReport: false,
    onSaveError: null,
    onSaveSuccess: null,
    relationshipButtonDisabled: false,
  },
  hideAddPatrolTab: false,
  hideAddReportTab: false,
  iconComponent: <AddButtonIcon />,
  modalProps: {},
  onAddPatrol: null,
  onAddReport: null,
  patrolData: {},
  reportData: {},
  showLabel: true,
  title: 'Add',
  variant: 'primary',
};

AddItemButton.propTypes = {
  analyticsMetadata: PropTypes.shape({
    category: PropTypes.string,
    location: PropTypes.string,
  }),
  className: PropTypes.string,
  formProps: addReportFormProps,
  hideAddPatrolTab: PropTypes.bool,
  hideAddReportTab: PropTypes.bool,
  iconComponent: PropTypes.node,
  modalProps: PropTypes.object,
  onAddPatrol: PropTypes.func,
  onAddReport: PropTypes.func,
  patrolData: PropTypes.object,
  reportData: PropTypes.object,
  showLabel: PropTypes.bool,
  title: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};

export default memo(AddItemButton);
