import React, { memo, useMemo } from 'react';
import isObject from 'lodash/isObject';
import { useSelector } from 'react-redux';

import { selectDisplayEventTypes } from '../selectors/event-types';

import DasIcon from '../DasIcon';

import * as styles from './styles.module.scss';

const EventIcon = ({ ref, report, ...rest }) => {
  const eventTypes = useSelector(selectDisplayEventTypes);

  const iconId = useMemo(() => {
    if (report.is_collection) {
      return 'incident_collection_rep';
    }

    const isPatrol = !!report?.patrol_segments?.length && isObject(report.patrol_segments[0]);
    const type = isPatrol ? report?.patrol_segments?.[0]?.patrol_type : report.event_type;
    const matchingEventType = eventTypes.find((eventType) => eventType.value === type);

    return matchingEventType?.icon_id ?? null;
  }, [eventTypes, report.event_type, report.is_collection, report.patrol_segments]);

  const singleContainedIconId = useMemo(() => {
    if (!report.is_collection || report.contains?.length !== 1) return null;

    const containedEventType = report.contains[0]?.related_event?.event_type;
    return eventTypes.find((et) => et.value === containedEventType)?.icon_id ?? null;
  }, [eventTypes, report.contains, report.is_collection]);

  if (singleContainedIconId) {
    return <span className={styles.wrapper} ref={ref}>
      <DasIcon iconId={iconId} type="events" title={report.event_type} {...rest} />
      <DasIcon className={styles.content} iconId={singleContainedIconId} type="events" />
    </span>;
  }

  return <DasIcon iconId={iconId} type="events" title={report.event_type} {...rest} />;
};

export default memo(EventIcon);
