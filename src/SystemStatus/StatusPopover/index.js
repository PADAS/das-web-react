import { useRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import useModalPopover from '../../hooks/useModalPopover';

import Badge from '../../Badge';
import TimeAgo from '../../TimeAgo';

import * as styles from './styles.module.scss';

const URL_PROTOCOL_REGEX = /^(https?|ftp):\/\//;

const StatusActivity = ({ label, timestamp }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'systemStatus' });

  return <span>
    {label}{!!timestamp && ':'}

    {!!timestamp && <TimeAgo className={styles.timestamp} date={timestamp} suffix={t('dateTimeSuffix')} />}
  </span>;
};

const StatusPopover = ({ className = '', onClose, ref, trigger, ...otherProps }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'systemStatus' });

  const systemStatus = useSelector((state) => state.data.systemStatus);

  const bodyRef = useRef(null);

  const { onKeyDown } = useModalPopover(bodyRef, trigger, onClose);

  const renderStatusSummary = (status, title) => <div className={styles.summary}>
    <Badge aria-hidden="true" className={styles.badge} status={status} />

    <span>{title}</span>

    <span className="sr-only">{t(status)}</span>
  </div>;

  return <Popover
    aria-label={t('popoverLabel')}
    className={`${styles.statusPopover} ${className}`}
    onKeyDown={onKeyDown}
    ref={ref}
    role="dialog"
    tabIndex={-1}
    {...otherProps}
  >
    <Popover.Body className={styles.body} ref={bodyRef}>
      <ul className={styles.statusList}>
        {Object.entries(systemStatus).map(([statusKey, statusValue]) => Array.isArray(statusValue)
          ? statusValue.map((service) => <li className={styles.statusItem} key={service.provider_key}>
            {renderStatusSummary(service.status, service.title)}

            <div className={styles.details}>
              <StatusActivity
                label={service.heartbeat.title ?? t('heartBeatDefTitle')}
                timestamp={service.heartbeat.timestamp}
              />

              <StatusActivity
                label={service.datasource.title ?? t('datasourceDefTitle')}
                timestamp={service.datasource.timestamp}
              />
            </div>
          </li>)
          : <li className={styles.statusItem} key={statusKey}>
            {renderStatusSummary(
              statusValue.status,
              statusValue.title ?? t(statusValue.titleKey, { version: statusValue.version })
            )}

            <div className={styles.details}>
              <StatusActivity
                label={(statusValue.details ?? t(statusValue.detailsKey)).replace(URL_PROTOCOL_REGEX, '')}
                timestamp={statusValue.timestamp}
              />
            </div>
          </li>)}
      </ul>
    </Popover.Body>
  </Popover>;
};

export default StatusPopover;
