import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '..';
import { getStoredTab, storeTab } from './utils';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { usePermissions, useSystemConfigFlag } from '../../hooks';

import AddPatrolTab from './AddPatrolTab';
import AddReportTab from './AddReportTab';

import styles from './styles.module.scss';

export const ADD_TAB_KEYS = { ADD_REPORT: 'reports', ADD_PATROL: 'patrols' };

const AddItemModal = ({ onHide, show, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal' });

  const { hideAddPatrolTab, hideAddReportTab } = useContext(AddItemContext);

  const hasPatrolWritePermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.CREATE);
  const patrolFlagEnabled = useSystemConfigFlag(SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT);

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const storedActiveTabKey = getStoredTab() || ADD_TAB_KEYS.ADD_REPORT;

  const [activeTabKey, setActiveTabKey] = useState(storedActiveTabKey);

  const patrolsEnabled = !!patrolFlagEnabled && !!hasPatrolWritePermissions && !!patrolTypes.length;

  const onTabSelect = useCallback((tab) => {
    storeTab(tab);
    setActiveTabKey(tab);
  }, []);

  useEffect(() => {
    const shouldSelectReportTab = !hideAddReportTab && (storedActiveTabKey === ADD_TAB_KEYS.ADD_REPORT || hideAddPatrolTab || !patrolsEnabled);
    const shouldSelectPatrolTab = !hideAddPatrolTab && patrolsEnabled && (storedActiveTabKey === ADD_TAB_KEYS.ADD_PATROL || hideAddReportTab);
    if (shouldSelectReportTab && activeTabKey !== ADD_TAB_KEYS.ADD_REPORT) {
      onTabSelect(ADD_TAB_KEYS.ADD_REPORT);
    } else if (shouldSelectPatrolTab && activeTabKey !== ADD_TAB_KEYS.ADD_PATROL) {
      onTabSelect(ADD_TAB_KEYS.ADD_PATROL);
    }
  }, [activeTabKey, hideAddPatrolTab, hideAddReportTab, onTabSelect, patrolsEnabled, storedActiveTabKey]);

  return <Modal data-testid="addItemButton-addItemModal" onHide={onHide} show={show} {...restProps}>
    <Modal.Header closeButton />

    <Modal.Body className={styles.modalBody}>
      <Tabs
        activeKey={activeTabKey}
        className={styles.tabs}
        fill
        onSelect={onTabSelect}
      >
        {!hideAddReportTab && <Tab
          data-testid="addItemButton-addItemModal-reportTab"
          eventKey={ADD_TAB_KEYS.ADD_REPORT}
          title={t('addReportTabTitle')}
        >
          <AddReportTab onHideModal={onHide} />
        </Tab>}

        {patrolsEnabled && !hideAddPatrolTab && <Tab
          data-testid="addItemButton-addItemModal-patrolTab"
          eventKey={ADD_TAB_KEYS.ADD_PATROL}
          title={t('addPatroTabTitle')}
        >
          <AddPatrolTab onHideModal={onHide} />
        </Tab>}
      </Tabs>
    </Modal.Body>
  </Modal>;
};

AddItemModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default memo(AddItemModal);
