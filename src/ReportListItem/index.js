import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import LocationJumpButton from '../LocationJumpButton';
import { jumpToLocation } from '../utils/map';

import { getCoordinatesForEvent, getCoordinatesForCollection, collectionHasMultipleValidLocations, displayTitleForEventByEventType } from '../utils/events';
import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

const ReportListItem = (props) => {
  const { eventTypes, map, report, onTitleClick, onIconClick, showDate, showJumpButton, className, key, dispatch: _dispatch, ...rest } = props;

  const coordinates = report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report);
  const hasMultipleLocations = collectionHasMultipleValidLocations(report);

  const iconClickHandler = onIconClick || onTitleClick;

  let displayPriority;

  if (report.is_collection && !report.contains) {
    console.log('i am buuuuuuuuusteeeeed', report);
  }

  if (report.is_collection && !!report.contains && !!report.contains.length) {
    const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);
    displayPriority = topRatedReportAndType ? (topRatedReportAndType.related_event.priority || topRatedReportAndType.event_type.default_priority) : report.priority;
  } else {
    displayPriority = report.priority;
  }


  const onJumpButtonClick = () => {
    trackEvent('Map Layers', 'Click Jump To Report Location button', `Report Type:${report.event_type}`);
    jumpToLocation(map, coordinates);
  };

  return <li className={`${styles.listItem} ${styles[`priority-${displayPriority}`]} ${className}`} key={key} {...rest}>
    <button type='button' className={styles.icon} onClick={() => iconClickHandler(report)}>
      <EventIcon report={report} />
    </button>
    <span className={styles.serialNumber}>{report.serial_number}</span>
    <button type='button' className={styles.title} onClick={() => onTitleClick(report)}>{displayTitleForEventByEventType(report)}</button>
    <span className={styles.date}>
      <DateTime date={report.updated_at || report.time} />
      {report.state === 'resolved' && <small className={styles.resolved}>resolved</small>}
    </span>
    {coordinates && !!coordinates.length && showJumpButton &&
      <LocationJumpButton isMulti={hasMultipleLocations} onButtonClick={onJumpButtonClick} />
    }
  </li>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });
export default connect(mapStateToProps, null)(memo(ReportListItem));

ReportListItem.defaultProps = {
  showJumpButton: true,
  showDate: true,
};

ReportListItem.propTypes = {
  key: PropTypes.string,
  report: PropTypes.object.isRequired,
  map: PropTypes.object,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  showJumpButton: PropTypes.bool,
  showDate: PropTypes.bool,
};