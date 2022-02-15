import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';

import { calcPrimaryStatusIndicator } from '../utils/system-status';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';

import Badge from '../Badge';
import TimeAgo from '../TimeAgo';

import { ReactComponent as ArrowDownSmallIcon } from '../common/images/icons/arrow-down-small.svg';

import styles from './styles.module.scss';

const { Item, Menu, Toggle } = Dropdown;

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const SystemStatus = ({ systemStatus }) => {
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

  return (
    <Dropdown
      alignRight
      onToggle={(isOpen) => mainToolbarTracker.track(`${isOpen ? 'Open':'Close'} Status Summary Display`)}
      >
      <Toggle id="system-status" className={styles.toggle}>
        <div className={styles.indicator}>
          <Badge status={statusSummary} />
          <span>Online</span>
          <ArrowDownSmallIcon />
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