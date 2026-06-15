import React, { memo, useMemo } from 'react';
import isObject from 'lodash/isObject';
import { useSelector } from 'react-redux';

import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { selectDisplayEventTypes } from '../selectors/event-types';

import SvgIcon from '../SvgIcon';

import * as styles from './styles.module.scss';

const EventIcon = ({ report, ...rest }) => {
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

  const nonContainerIconId = useMemo(() => {
    if (!report.is_collection) return null;

    const topRated = calcTopRatedReportAndTypeForCollection(report, eventTypes);
    return topRated?.event_type?.icon_id ?? null;
  }, [eventTypes, report]);

  if (nonContainerIconId) {
    return <span className={styles.wrapper}>
      <SvgIcon iconId={iconId} type="events" title={report.event_type} {...rest} />
      <SvgIcon className={styles.content} iconId={nonContainerIconId} type="events" />
    </span>;
  }

  return <SvgIcon iconId={iconId} type="events" title={report.event_type} {...rest} />;
};

export default memo(EventIcon);
