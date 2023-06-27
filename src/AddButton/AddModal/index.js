import React, { memo, useCallback, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { useSelector } from 'react-redux';

import { addReportFormProps } from '../../proptypes';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { useSystemConfigFlag, usePermissions } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import AddPatrolTab from './AddPatrolTab';
import AddReportTab from './AddReportTab';

import styles from './styles.module.scss';

const ADD_TAB_KEYS = { ADD_REPORT: 'reports', ADD_PATROL: 'patrols' };
const STORAGE_KEY = 'selectedAddReportTab';

const AddModal = ({
  analyticsMetadata,
  formProps,
  hideAddPatrolTab,
  hideAddReportTab,
  onAddPatrol,
  onAddReport,
  onHide,
  patrolData,
  reportData,
  show,
  ...rest
}) => {
  const navigate = useNavigate();

  const hasPatrolWritePermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.CREATE);
  const patrolFlagEnabled = useSystemConfigFlag(SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT);

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const storedActiveTabKey = window.localStorage.getItem(STORAGE_KEY) || ADD_TAB_KEYS.ADD_REPORT;

  const [activeTabKey, setActiveTabKey] = useState(storedActiveTabKey);

  const patrolsEnabled = !!patrolFlagEnabled
    && !!hasPatrolWritePermissions
    && !!patrolTypes.length;

  const onTabSelect = useCallback((tab) => {
    window.localStorage.setItem(STORAGE_KEY, tab);
    setActiveTabKey(tab);
  }, []);

  useEffect(() => {
    const shouldShowReportTab = !hideAddReportTab && (hideAddPatrolTab || !patrolsEnabled || storedActiveTabKey === ADD_TAB_KEYS.ADD_REPORT);
    const shouldShowPatrolTab = !hideAddPatrolTab && (hideAddReportTab || storedActiveTabKey === ADD_TAB_KEYS.ADD_PATROL);
    if (shouldShowReportTab && activeTabKey !== ADD_TAB_KEYS.ADD_REPORT) {
      onTabSelect(ADD_TAB_KEYS.ADD_REPORT);
    } else if (shouldShowPatrolTab && activeTabKey !== ADD_TAB_KEYS.ADD_PATROL) {
      onTabSelect(ADD_TAB_KEYS.ADD_PATROL);
    }
  }, [activeTabKey, hideAddPatrolTab, hideAddReportTab, onTabSelect, patrolsEnabled, show, storedActiveTabKey]);

  return <Modal data-testid="addButton-addModal" onHide={onHide} show={show} {...rest}>
    <Modal.Header closeButton />

    <Modal.Body className={styles.modalBody}>
      <Tabs
        activeKey={activeTabKey}
        className={styles.tabs}
        fill
        onSelect={onTabSelect}
      >
        {!hideAddReportTab && <Tab
          data-testid="addButton-addModal-reportTab"
          eventKey={ADD_TAB_KEYS.ADD_REPORT}
          title="Add Report"
        >
          <AddReportTab
            analyticsMetadata={analyticsMetadata}
            formProps={formProps}
            navigate={navigate}
            onAddReport={onAddReport}
            onHideModal={onHide}
            reportData={reportData}
          />
        </Tab>}

        {patrolsEnabled && !hideAddPatrolTab && <Tab
          data-testid="addButton-addModal-patrolTab"
          eventKey={ADD_TAB_KEYS.ADD_PATROL}
          title="Add Patrol"
        >
          <AddPatrolTab
            analyticsMetadata={analyticsMetadata}
            formProps={formProps}
            navigate={navigate}
            onAddPatrol={onAddPatrol}
            onHideModal={onHide}
            patrolData={patrolData}
          />
        </Tab>}
      </Tabs>
    </Modal.Body>
  </Modal>;
};

AddModal.defatultProps = {
  analyticsMetadata: {
    category: 'Feed',
    location: null,
  },
  formProps: {
    hidePatrols: false,
    isPatrolReport: false,
    onSaveError: null,
    onSaveSuccess: null,
    relationshipButtonDisabled: false,
  },
  hideAddPatrolTab: false,
  hideAddReportTab: false,
  onAddPatrol: null,
  onAddReport: null,
  onHide: null,
  patrolData: {},
  reportData: {},
};

AddModal.propTypes = {
  analyticsMetadata: PropTypes.shape({
    category: PropTypes.string,
    location: PropTypes.string,
  }),
  formProps: addReportFormProps,
  hideAddPatrolTab: PropTypes.bool,
  hideAddReportTab: PropTypes.bool,
  onAddPatrol: PropTypes.func,
  onAddReport: PropTypes.func,
  onHide: PropTypes.func,
  patrolData: PropTypes.object,
  reportData: PropTypes.object,
};

export default memo(AddModal);
