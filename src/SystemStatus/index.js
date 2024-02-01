import React, { useCallback, useMemo, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUpSmallIcon } from '../common/images/icons/arrow-up-small.svg';

import { calcPrimaryStatusIndicator } from '../utils/system-status';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';

import Badge from '../Badge';
import TimeAgo from '../TimeAgo';

import styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const SystemStatus = () => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'systemStatus' });

  const systemStatus = useSelector((state) => state.data.systemStatus);

  const [isOpen, setOpenState] = useState(false);

  const renderedStatusList = useMemo(() => Object.entries(systemStatus).map(([_key, value], index) => {
    if (Array.isArray(value)) {
      return value.map((item) => <Dropdown.Item className={styles.listItem} key={item.provider_key}>
        <div className={styles.summary}>
          <Badge className={styles.badge} status={item.status} />

          <span className={styles.itemTitle}>{item.title}</span>
        </div>

        <div className={styles.details}>
          <span>
            {item.heartbeat.title}{!!item.heartbeat.timestamp && ':'}

            {!!item.heartbeat.timestamp && <span className={styles.timestamp}>
              <TimeAgo date={item.heartbeat.timestamp} suffix={t('dateTimeSuffix')} />
            </span>}
          </span>

          <span>
            {item.datasource.title}{!!item.datasource.timestamp && ':'}

            {!!item.datasource.timestamp && <span className={styles.timestamp}>
              <TimeAgo date={item.datasource.timestamp} suffix={t('dateTimeSuffix')} />
            </span>}
          </span>
        </div>
      </Dropdown.Item>);
    }

    return <Dropdown.Item className={styles.listItem} key={index}>
      <div className={styles.summary}>
        <Badge className={styles.badge} status={value.status} />

        <span className={styles.itemTitle}>{value.title}</span>
      </div>

      <div className={styles.details}>
        <span>
          {!!value.details && value.details.replace(/^(https?|ftp):\/\//, '')}{!!value.timestamp && ':'}

          {!!value.timestamp && <span className={styles.timestamp}>
            <TimeAgo date={value.timestamp} suffix={t('dateTimeSuffix')} />
          </span>}
        </span>
      </div>
    </Dropdown.Item>;
  }), [systemStatus, t]);

  const statusSummary = useMemo(() => calcPrimaryStatusIndicator(systemStatus), [systemStatus]);

  const onDropdownToggle = useCallback((isOpen) => {
    setOpenState(isOpen);

    mainToolbarTracker.track(`${isOpen ? 'Open':'Close'} Status Summary Display`);
  }, []);

  return (
    <Dropdown align="end" onToggle={onDropdownToggle}>
      <Dropdown.Toggle id="system-status" className={styles.toggle}>
        <div className={`${styles.indicator} ${isOpen ? 'open' : ''}`} data-testid="systemStatus-indicator">
          <Badge status={statusSummary} />

          <span data-testid="systemStatus-statusLabel">{t(statusSummary || 'UNHEALTHY' )}</span>

          {isOpen ? <ArrowUpSmallIcon /> : <ArrowDownSmallIcon />}
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.menu}>{renderedStatusList}</Dropdown.Menu>
    </Dropdown>
  );
};

export default SystemStatus;
