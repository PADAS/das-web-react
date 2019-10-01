import React, { memo } from 'react';
import { connect } from 'react-redux';
import EventIcon from '../EventIcon';
import PropTypes from 'prop-types';
import { calcTopRatedReportAndTypeForCollection, calcIconColorByPriority } from '../utils/event-types';
import styles from './styles.module.scss';

const DasCollectionIcon = (props) => {
  const { color, eventTypes, report, className, dispatch:_dispatch, ...rest } = props;

  const { related_event:topRatedReport, event_type:topRatedEventType } = calcTopRatedReportAndTypeForCollection(report, eventTypes);

  return (
    <div className={`${styles.icon} ${className}`} {...rest}>
      <EventIcon className={styles.wrapper} iconId='incident_collection' />
      <EventIcon
        style={{
          fill: color || calcIconColorByPriority(topRatedReport.priority || topRatedEventType.default_priority)
        }}
        className={styles.content} iconId={topRatedEventType.icon_id} />
    </div>
  );
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(memo(DasCollectionIcon));

DasCollectionIcon.propTypes = {
  eventTypes: PropTypes.array.isRequired,
};