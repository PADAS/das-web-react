import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';
import DasIcon from '../DasIcon';
import PropTypes from 'prop-types';

import { calcTopRatedReportAndTypeForCollection, calcIconColorByPriority } from '../utils/event-types';

import styles from './styles.module.scss';

const EventIcon = ({report, eventTypes, color, ...rest}) => {
  const { is_collection } = report;

  if (!is_collection) {
    const { icon_id } = eventTypes.find(({ value }) => value === report.event_type);
    return <DasIcon type='events' iconId={icon_id} {...rest} />;
  }

  const { event_type:topRatedEventType } = calcTopRatedReportAndTypeForCollection(report, eventTypes);

  return <span className={styles.wrapper}>
    <DasIcon type='events' iconId='incident_collection'  {...rest}  />
    <DasIcon type='events'  {...rest} 
      style={{
        fill: 'white',
      }}
      className={styles.content} iconId={topRatedEventType.icon_id} />
  </span>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(memo(EventIcon));

EventIcon.propTypes = {
  iconId: PropTypes.string.isRequired,
};