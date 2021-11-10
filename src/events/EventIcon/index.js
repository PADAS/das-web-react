import React, { memo, forwardRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isObject from 'lodash/isObject';

import DasIcon from '../../common/components/icons/DasIcon';
import { calcTopRatedReportAndTypeForCollection } from '../../utils/event-types';
import { displayEventTypes } from '../../selectors/event-types';

import styles from './styles.module.scss';

const EventIcon = forwardRef(({ report, eventTypes, color, ...rest }, ref) => { /* eslint-disable-line react/display-name */
  const { is_collection } = report;
  const isPatrol = !!report?.patrol_segments?.length && isObject(report.patrol_segments[0]);

  if (!is_collection) {
    let iconId = null;
    const matchingEventType = eventTypes.find(({ value }) => value ===
     ( isPatrol ? report?.patrol_segments?.[0]?.patrol_type : report.event_type));
    if (matchingEventType) iconId = matchingEventType.icon_id;
    return <DasIcon type='events' iconId={iconId} {...rest} />;
  }

  const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);

  return <span ref={ref} className={styles.wrapper}>
    <DasIcon type='events' iconId='incident_collection'  {...rest}  />
    {topRatedReportAndType && topRatedReportAndType.event_type && <DasIcon type='events' {...rest}
      style={{
        fill: 'white',
      }}
      className={styles.content} iconId={topRatedReportAndType.event_type.icon_id} />}
  </span>;
});

const mapStateToProps = (state) => ({ eventTypes: displayEventTypes(state) });

export default connect(mapStateToProps, null)(memo(EventIcon));

EventIcon.propTypes = {
  report: PropTypes.object.isRequired,
};