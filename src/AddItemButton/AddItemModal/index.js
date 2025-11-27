import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '..';
import { getStoredTab, storeTab } from './utils';

import AddPatrolTab from './AddPatrolTab';
import AddReportTab from './AddReportTab';

import * as styles from './styles.module.scss';

export const ADD_TAB_KEYS = { ADD_REPORT: 'reports', ADD_PATROL: 'patrols' };

const AddItemModal = ({ onHide, show, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal' });

  const { hideAddEventTab, hideAddPatrolTab } = useContext(AddItemContext);

  const storedActiveTabKey = getStoredTab() || ADD_TAB_KEYS.ADD_REPORT;

  const [activeTabKey, setActiveTabKey] = useState(storedActiveTabKey);

  const onTabSelect = useCallback((tab) => {
    storeTab(tab);
    setActiveTabKey(tab);
  }, []);

  useEffect(() => {
    const shouldSelectEventsTab = !hideAddEventTab
      && activeTabKey !== ADD_TAB_KEYS.ADD_REPORT
      && (storedActiveTabKey === ADD_TAB_KEYS.ADD_REPORT || hideAddPatrolTab);
    const shouldSelectPatrolsTab = !hideAddPatrolTab
      && activeTabKey !== ADD_TAB_KEYS.ADD_PATROL
      && (storedActiveTabKey === ADD_TAB_KEYS.ADD_PATROL || hideAddEventTab);
    if (shouldSelectEventsTab) {
      onTabSelect(ADD_TAB_KEYS.ADD_REPORT);
    } else if (shouldSelectPatrolsTab) {
      onTabSelect(ADD_TAB_KEYS.ADD_PATROL);
    }
  }, [activeTabKey, hideAddEventTab, hideAddPatrolTab, onTabSelect, storedActiveTabKey]);

  return <Modal data-testid="addItemButton-addItemModal" onHide={onHide} show={show} {...restProps}>
    <Modal.Header closeButton />

    <Modal.Body className={styles.modalBody}>
      <Tabs
        activeKey={activeTabKey}
        className={styles.tabs}
        fill
        onSelect={onTabSelect}
      >
        {!hideAddEventTab && <Tab
          data-testid="addItemButton-addItemModal-reportTab"
          eventKey={ADD_TAB_KEYS.ADD_REPORT}
          title={t('addReportTabTitle')}
        >
          <AddReportTab onHideModal={onHide} />
        </Tab>}

        {!hideAddPatrolTab && <Tab
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
