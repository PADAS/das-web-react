import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '..';
import { getStoredTab, storeTab } from './utils';
import { useEventsPermissions, usePatrolsPermissions } from '../../hooks/usePermissions';

import AddPatrolTab from './AddPatrolTab';
import AddReportTab from './AddReportTab';

import * as styles from './styles.module.scss';

export const ADD_TAB_KEYS = { ADD_REPORT: 'reports', ADD_PATROL: 'patrols' };

const AddItemModal = ({ onHide, show, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal' });

  const eventTypes = useSelector((state) => state.data.eventTypes);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const { hasEventsCreatePermission } = useEventsPermissions();
  const { hasPatrolsCreatePermission } = usePatrolsPermissions();

  const { hideAddPatrolTab, hideAddReportTab } = useContext(AddItemContext);

  const storedActiveTabKey = getStoredTab() || ADD_TAB_KEYS.ADD_REPORT;

  const [activeTabKey, setActiveTabKey] = useState(storedActiveTabKey);

  const canAddEvents = hasEventsCreatePermission && eventTypes.length > 0 && !hideAddReportTab;
  const canAddPatrols = hasPatrolsCreatePermission && patrolTypes.length > 0 && !hideAddPatrolTab;

  const onTabSelect = useCallback((tab) => {
    storeTab(tab);
    setActiveTabKey(tab);
  }, []);

  useEffect(() => {
    const shouldSelectEventsTab = canAddEvents
      && activeTabKey !== ADD_TAB_KEYS.ADD_REPORT
      && (storedActiveTabKey === ADD_TAB_KEYS.ADD_REPORT || !canAddPatrols);
    const shouldSelectPatrolsTab = canAddPatrols
      && activeTabKey !== ADD_TAB_KEYS.ADD_PATROL
      && (storedActiveTabKey === ADD_TAB_KEYS.ADD_PATROL || !canAddEvents);
    if (shouldSelectEventsTab) {
      onTabSelect(ADD_TAB_KEYS.ADD_REPORT);
    } else if (shouldSelectPatrolsTab) {
      onTabSelect(ADD_TAB_KEYS.ADD_PATROL);
    }
  }, [activeTabKey, canAddEvents, canAddPatrols, onTabSelect, storedActiveTabKey]);

  return <Modal data-testid="addItemButton-addItemModal" onHide={onHide} show={show} {...restProps}>
    <Modal.Header closeButton />

    <Modal.Body className={styles.modalBody}>
      <Tabs
        activeKey={activeTabKey}
        className={styles.tabs}
        fill
        onSelect={onTabSelect}
      >
        {canAddEvents && <Tab
          data-testid="addItemButton-addItemModal-reportTab"
          eventKey={ADD_TAB_KEYS.ADD_REPORT}
          title={t('addReportTabTitle')}
        >
          <AddReportTab onHideModal={onHide} />
        </Tab>}

        {canAddPatrols && <Tab
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

export default memo(AddItemModal);
