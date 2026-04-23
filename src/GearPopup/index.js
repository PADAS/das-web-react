import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TimeAgo from '../TimeAgo';
import { gearHumanReadableLabel } from '../utils/gear';

import * as styles from './styles.module.scss';

const GearPopup = ({ data }) => {
  const { t } = useTranslation('map-popups', { keyPrefix: 'gearPopup' });
  const gearId = data?.properties?.id;
  const gear = useSelector((state) => (gearId ? state.data.gear.byId[gearId] : null));

  if (!gear) return null;

  const primaryLabel = gearHumanReadableLabel(gear);
  const popupTitle = gear.manufacturer
    ? `${gear.manufacturer}: ${primaryLabel}`
    : primaryLabel;
  const { coordinates } = data;

  const mostRecentDate = (gear.devices || []).reduce((best, device) => {
    if (!device.last_deployed) return best;
    return !best || device.last_deployed > best ? device.last_deployed : best;
  }, null) || gear.last_updated;

  return <>
    <div className={styles.header}>
      <h2 className={styles.title} data-testid="gear-popup-title">{popupTitle}</h2>

      {mostRecentDate && <div className={styles.dateTimeWrapper}>
        <DateTime className={styles.dateTimeDetails} date={mostRecentDate} showElapsed={false} />

        <span className={styles.dateTimeComma}>, </span>

        <TimeAgo className={styles.timeAgo} date={mostRecentDate} suffix={t('dateTimeSuffix')} />
      </div>}
    </div>

    <div className={styles.body}>
      {coordinates && <GpsFormatToggle
        className={styles.gpsFormatToggle}
        lngLat={{ latitude: coordinates[1], longitude: coordinates[0] }}
        name="gearPopup-gpsFormatToggle"
      />}

      <dl className={styles.details}>
        <dt>{t('typeLabel')}</dt>
        <dd>{gear.type}</dd>

        {[...(gear.devices || [])].sort((a, b) => {
          if (!a.last_deployed && !b.last_deployed) return 0;
          if (!a.last_deployed) return 1;
          if (!b.last_deployed) return -1;
          if (a.last_deployed === b.last_deployed) return 0;
          return a.last_deployed > b.last_deployed ? 1 : -1;
        }).map((device) => <React.Fragment key={device.device_id}>
          <dt>{t('deviceLabel', { label: device.label || device.mfr_device_id || device.device_id })}</dt>
          <dd>
            <span className={styles.deviceId}>{device.mfr_device_id || device.device_id}</span>
            {device.last_deployed && <>
              {' '}
              <DateTime date={device.last_deployed} showElapsed={false} />
            </>}
          </dd>
        </React.Fragment>)}
      </dl>
    </div>
  </>;
};

export default memo(GearPopup);
