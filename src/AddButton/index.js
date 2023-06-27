import React, { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { addReportFormProps } from '../proptypes';
import { trackEvent } from '../utils/analytics';

import AddModal from './AddModal';

import styles from './styles.module.scss';

const AddButton = ({
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

  const onClick = useCallback(() => {
    setShowModal(true);

    trackEvent(
      analyticsMetadata.category,
      `Click 'Add Report' button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [analyticsMetadata.category, analyticsMetadata.location]);

  const onHideModal = useCallback(() => setShowModal(false), []);

  return <>
    <AddModal
      analyticsMetadata={analyticsMetadata}
      formProps={formProps}
      hideAddPatrolTab={hideAddPatrolTab}
      hideAddReportTab={hideAddReportTab}
      onAddPatrol={onAddPatrol}
      onAddReport={onAddReport}
      patrolData={patrolData}
      reportData={reportData}
      {...modalProps}
      onHide={onHideModal}
      show={showModal}
    />

    <button
        className={`${styles[`addButton-${variant}`]} ${className}`}
        data-testid="addModal-addButton"
        onClick={onClick}
        title={title}
        type="button"
        {...rest}
      >
      {iconComponent}

      {showLabel && <label>{title}</label>}
    </button>
  </>;
};

AddButton.defaultProps = {
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

AddButton.propTypes = {
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

export default memo(AddButton);
