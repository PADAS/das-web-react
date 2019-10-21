import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';
import DasIcon from '../DasIcon';
import PropTypes from 'prop-types';

import { calcTopRatedReportAndTypeForCollection, calcIconColorByPriority } from '../utils/event-types';

import styles from './styles.module.scss';

const EventIcon = ({report, eventTypes, color, ...rest}) => {
  const { is_collection } = report;

  if (!is_collection) {
    let iconId = null;
    const matchingEventType = eventTypes.find(({ value }) => value === report.event_type);
    if (matchingEventType) iconId = matchingEventType.icon_id;
    return <DasIcon type='events' iconId={iconId} {...rest} />;

  }

  const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);

  return <span className={styles.wrapper}>
    <DasIcon type='events' iconId='incident_collection'  {...rest}  />
    {topRatedReportAndType && topRatedReportAndType.event_type && <DasIcon type='events'  {...rest} 
      style={{
        fill: 'white',
      }}
      className={styles.content} iconId={topRatedReportAndType.event_type.icon_id} />}
  </span>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(memo(EventIcon));

EventIcon.propTypes = {
  report: PropTypes.object.isRequired,
};