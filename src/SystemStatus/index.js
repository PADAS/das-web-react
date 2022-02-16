import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';

import { calcPrimaryStatusIndicator } from '../utils/system-status';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';
import { STATUSES } from '../constants';

import Badge from '../Badge';
import TimeAgo from '../TimeAgo';

import { ReactComponent as ArrowDownSmallIcon } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUpSmallIcon } from '../common/images/icons/arrow-up-small.svg';

import styles from './styles.module.scss';

const { HEALTHY_STATUS, WARNING_STATUS, UNHEALTHY_STATUS } = STATUSES;

const { Item, Menu, Toggle } = Dropdown;

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const calculateLabelFromStatus = (status) => {
  if (!status) return 'Unhealthy';

  switch (status) {
  case (UNHEALTHY_STATUS):
    return 'Unhealthy';
  case WARNING_STATUS:
    return 'Warning';
  case HEALTHY_STATUS:
    return 'Healthy';
  default:
    return 'Unknown';
  }
};

const SystemStatus = ({ systemStatus }) => {
  const [isOpen, setOpenState] = useState(false);

  const renderedStatusList = useMemo(() => {
    return Object.entries(systemStatus).map(([_key, value], index) => {
      if (Array.isArray(value)) {
        return value.map((item) =>
          <Item className={styles.listItem} key={item.provider_key}>
            <div className={styles.summary}>
              <Badge className={styles.badge} status={item.status} />
              <span className={styles.itemTitle}>{item.title}</span>
            </div>

            <div className={styles.details}>
              <span>
                {item.heartbeat.title}{!!item.heartbeat.timestamp &&':'}
                {!!item.heartbeat.timestamp &&  <span className={styles.timestamp}><TimeAgo date={item.heartbeat.timestamp} suffix='ago' /></span>}
              </span>

              <span>
                {item.datasource.title}{!!item.datasource.timestamp && ':'}
                {!!item.datasource.timestamp && <span className={styles.timestamp}><TimeAgo date={item.datasource.timestamp} suffix='ago' /></span>}
              </span>
            </div>
          </Item>
        );
      }

      return <Item className={styles.listItem} key={index}>
        <div className={styles.summary}>
          <Badge className={styles.badge} status={value.status} />
          <span className={styles.itemTitle}>{value.title}</span>
        </div>

        <div className={styles.details}>
          <span>
            {!!value.details && value.details.replace(/^(https?|ftp):\/\//, '')}{!!value.timestamp && ':'}
            {!!value.timestamp && <span className={styles.timestamp}><TimeAgo date={value.timestamp} suffix='ago' /></span>}
          </span>
        </div>
      </Item>;
    });
  }, [systemStatus]);

  const statusSummary = useMemo(() => calcPrimaryStatusIndicator(systemStatus), [systemStatus]);

  const onDropdownToggle = useCallback((isOpen) => {
    setOpenState(isOpen);
    mainToolbarTracker.track(`${isOpen ? 'Open':'Close'} Status Summary Display`);
  }, [setOpenState]);

  return (
    <Dropdown alignRight onToggle={onDropdownToggle}>
      <Toggle id="system-status" className={styles.toggle}>
        <div className={`${styles.indicator} ${isOpen ? 'open' : ''}`} data-testid="systemStatus-indicator">
          <Badge status={statusSummary} />
          <span data-testid="systemStatus-statusLabel">{calculateLabelFromStatus(statusSummary)}</span>
          {isOpen ? <ArrowUpSmallIcon /> : <ArrowDownSmallIcon />}
        </div>
      </Toggle>

      <Menu className={styles.menu}>
        {renderedStatusList}
      </Menu>
    </Dropdown>
  );
};

const mapStateToProps = ({ data: { systemStatus } }) => ({ systemStatus });

export default connect(mapStateToProps, null)(SystemStatus);