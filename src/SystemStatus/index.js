import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'react-bootstrap';

import TimeAgo from 'react-timeago'
import Badge from '../Badge';

import { calcPrimaryStatusIndicator } from '../utils/system-status';
import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

class SystemStatusComponent extends Component {

  renderStatusList() {
    return Object.entries(this.props.systemStatus).map(([key, value], index) => {
      if (key === 'services') {
        return value.map((item) =>
          <Item className={styles.listItem} key={item.provider_key}>
            <Badge status={item.status} />
            {item.title}
            {item.heartbeat.title}
            {!!item.heartbeat.timestamp && <TimeAgo date={item.heartbeat.timestamp} />}
            {item.datasource.title}
            {!!item.datasource.timestamp && <TimeAgo date={item.datasource.timestamp} />}
          </Item>
        );
      }
      return <Item className={styles.listItem} key={index}>
        <Badge status={value.status} />
        {value.title}
        {value.details}
        {!!value.timestamp && <TimeAgo date={value.timestamp} />}
      </Item>
    });
  }
  render() {
    const statusSummary = calcPrimaryStatusIndicator(this.props.systemStatus);
    return (
      <Dropdown>
        <Toggle id="dropdown-basic" className={styles.toggle}>
          <Badge status={statusSummary} />
        </Toggle>

        <Menu>
          {this.renderStatusList()}
        </Menu>
      </Dropdown>
    );
  }
}

const mapStateToProps = ({ data: { systemStatus } }) => ({ systemStatus });

export default connect(mapStateToProps, null)(SystemStatusComponent);