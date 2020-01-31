import React, { memo, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import LocationJumpButton from '../LocationJumpButton';

import { getCoordinatesForEvent, getCoordinatesForCollection, collectionHasMultipleValidLocations, 
  displayTitleForEventByEventType, getEventIdsForCollection } from '../utils/events';
import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { setBounceEventId } from '../ducks/map-ui';

import styles from './styles.module.scss';

const ReportListItem = (props) => {
  const { eventTypes, map, report, onTitleClick, setBounceEventId, onIconClick, showDate, showJumpButton, className, key, dispatch: _dispatch, ...rest } = props;

  const coordinates = report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report);
  const hasMultipleLocations = collectionHasMultipleValidLocations(report);

  // only fire bounce on the second and subsequentclick of a jump.
  // TODO THis really should be up in the parent, for better fidelity. 
  const locationClicked = useRef(false);

  const iconClickHandler = onIconClick || onTitleClick;

  let displayPriority;

  if (report.is_collection) {
    const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);
    if (topRatedReportAndType) {
      displayPriority =
        (topRatedReportAndType.related_event && topRatedReportAndType.related_event.hasOwnProperty('priority')) ?
          topRatedReportAndType.related_event.priority :
          (topRatedReportAndType.event_type && topRatedReportAndType.event_type.hasOwnProperty('default_priority')) ?
            topRatedReportAndType.event_type.default_priority : report.priority;
    } else {
      displayPriority = report.priority;
    }
  } else {
    displayPriority = report.priority;
  }
  
  const displayTitle = displayTitleForEventByEventType(report);

  const bounceId = hasMultipleLocations ? getEventIdsForCollection(report) : [report.id];

  const onBounceClick = () => {
    if (locationClicked.current) {
      setBounceEventId(bounceId);
    }
    locationClicked.current = true;
  };

  return <li title={displayTitle} className={`${styles.listItem} ${styles[`priority-${displayPriority}`]} ${className}`} key={key} {...rest}>
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
      <LocationJumpButton isMulti={hasMultipleLocations}  map={map} coordinates={coordinates} onBounceClick = {onBounceClick}
        clickAnalytics={['Map Layers', 'Click Jump To Report Location button', `Report Type:${report.event_type}`]} />
    }
  </li>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });
export default connect(mapStateToProps, { setBounceEventId })(memo(ReportListItem));

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