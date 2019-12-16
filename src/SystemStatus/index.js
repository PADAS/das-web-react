import React, { Component } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';

import TimeAgo from 'react-timeago';
import Badge from '../Badge';

import { calcPrimaryStatusIndicator } from '../utils/system-status';
import styles from './styles.module.scss';
import { trackEvent } from '../utils/analytics';

const { Toggle, Menu, Item } = Dropdown;

class SystemStatusComponent extends Component {

  onDropdownToggle(isOpen) {
    trackEvent('Main Toolbar', `${isOpen ? 'Open':'Close'} Status Summary Display`);
  }

  renderStatusList() {
    return Object.entries(this.props.systemStatus).map(([key, value], index) => {
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
                {!!item.heartbeat.timestamp &&  <span className={styles.timestamp}><TimeAgo date={item.heartbeat.timestamp} /></span>}
              </span>
              <span>
                {item.datasource.title}{!!item.datasource.timestamp && ':'}
                {!!item.datasource.timestamp && <span className={styles.timestamp}><TimeAgo date={item.datasource.timestamp} /></span>}
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
            {value.details}{!!value.timestamp && ':'}
            {!!value.timestamp && <span className={styles.timestamp}><TimeAgo date={value.timestamp} /></span>}
          </span>
        </div>
      </Item>;
    });
  }

  render() {
    const statusSummary = calcPrimaryStatusIndicator(this.props.systemStatus);
    return (
      <Dropdown alignRight onToggle={this.onDropdownToggle}>
        <Toggle id="system-status" className={styles.toggle}>
          <Badge status={statusSummary} />
        </Toggle>

        <Menu className={styles.menu}>
          {this.renderStatusList()}
        </Menu>
      </Dropdown>
    );
  }
}

const mapStateToProps = ({ data: { systemStatus } }) => ({ systemStatus });

export default connect(mapStateToProps, null)(SystemStatusComponent);