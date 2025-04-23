import React, { memo, useMemo } from 'react';
import isObject from 'lodash/isObject';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { selectDisplayEventTypes } from '../selectors/event-types';

import DasIcon from '../DasIcon';

import * as styles from './styles.module.scss';

const EventIcon = ({ ref, report, ...rest }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventIcon' });

  const eventTypes = useSelector(selectDisplayEventTypes);

  const topRatedReportAndType = useMemo(
    () => report.is_collection ? calcTopRatedReportAndTypeForCollection(report, eventTypes) : null,
    [eventTypes, report]
  );

  const iconId = useMemo(() => {
    if (!report.is_collection) {
      const isPatrol = !!report?.patrol_segments?.length && isObject(report.patrol_segments[0]);
      const type = isPatrol ? report?.patrol_segments?.[0]?.patrol_type : report.event_type;
      const matchingEventType = eventTypes.find((eventType) => eventType.value === type);

      if (matchingEventType) {
        return matchingEventType.icon_id;
      }
    }
    return null;
  }, [eventTypes, report.event_type, report.is_collection, report.patrol_segments]);

  if (!report.is_collection) {
    return <DasIcon iconId={iconId} type="events" title={report.event_type} {...rest} />;
  }

  return <span className={styles.wrapper} ref={ref} title={t('collectionTitle')}>
    <DasIcon iconId="incident_collection" type="events" {...rest} />

    {topRatedReportAndType && topRatedReportAndType.event_type && <DasIcon
      type="events"
      {...rest}
      className={styles.content}
      iconId={topRatedReportAndType.event_type.icon_id}
      style={{ fill: 'white' }}
    />}
  </span>;
};

export default memo(EventIcon);
