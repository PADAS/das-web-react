import React, { memo, useMemo } from 'react';
import isObject from 'lodash/isObject';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { selectDisplayEventTypes } from '../selectors/event-types';

import SvgIcon from '../SvgIcon';

import * as styles from './styles.module.scss';

const EventIcon = ({ report, ...rest }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventIcon' });

  const eventTypes = useSelector(selectDisplayEventTypes);

  const iconId = useMemo(() => {
    if (report.is_collection) {
      if (!report.icon_id || report.icon_id === 'incident_collection') {
        return 'incident_collection_rep';
      }
      return report.icon_id;
    }

    const isPatrol = !!report?.patrol_segments?.length && isObject(report.patrol_segments[0]);
    const type = isPatrol ? report?.patrol_segments?.[0]?.patrol_type : report.event_type;
    const matchingEventType = eventTypes.find((eventType) => eventType.value === type);

    return matchingEventType?.icon_id ?? null;
  }, [eventTypes, report.event_type, report.icon_id, report.is_collection, report.patrol_segments]);

  // The accessible name: the collection tooltip, or the event type's display title —
  // never the raw slug (e.g. carcass_rep), which would leak into aria-label.
  const title = useMemo(() => {
    if (report.is_collection) return t('collectionTitle');

    const isPatrol = !!report?.patrol_segments?.length && isObject(report.patrol_segments[0]);
    const type = isPatrol ? report?.patrol_segments?.[0]?.patrol_type : report.event_type;
    const matchingEventType = eventTypes.find((eventType) => eventType.value === type);

    return matchingEventType?.display ?? report.event_type ?? null;
  }, [eventTypes, report.event_type, report.is_collection, report.patrol_segments, t]);

  const nonContainerIconId = useMemo(() => {
    if (!report.is_collection) return null;

    const topRated = calcTopRatedReportAndTypeForCollection(report, eventTypes);
    return topRated?.event_type?.icon_id ?? null;
  }, [eventTypes, report]);

  if (nonContainerIconId) {
    return <span className={styles.wrapper} title={t('collectionTitle')}>
      <SvgIcon iconId={iconId} type="events" {...rest} />
      <SvgIcon className={styles.content} iconId={nonContainerIconId} type="events" />
    </span>;
  }

  return <SvgIcon iconId={iconId} type="events" title={title} {...rest} />;
};

export default memo(EventIcon);
