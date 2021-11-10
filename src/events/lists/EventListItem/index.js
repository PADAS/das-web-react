import React, { memo, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import DateTime from '../../../common/components/date/DateTime';
import EventIcon from '../../EventIcon';
import LocationJumpButton from '../../../map/controls/LocationJumpButton';

import { displayEventTypes } from '../../../selectors/event-types';

import { getCoordinatesForEvent, getCoordinatesForCollection, collectionHasMultipleValidLocations,
  displayTitleForEvent, getEventIdsForCollection } from '../../../utils/events';
import { calcTopRatedReportAndTypeForCollection } from '../../../utils/event-types';
import { setBounceEventIDs } from '../../../ducks/map-ui';
import { jumpToLocation } from '../../../utils/map';

import styles from './styles.module.scss';

const EventListItem = (props) => {
  const { eventTypes, priority = null, displayTime = null, title = null, map, report, onTitleClick, setBounceEventIDs, onIconClick, showDate, showJumpButton, className, key, zoom, dispatch: _dispatch, ...rest } = props;

  const coordinates = report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report);
  const hasMultipleLocations = collectionHasMultipleValidLocations(report);


  const locationClicked = useRef(false);

  const iconClickHandler = onIconClick || onTitleClick;
  const hasPatrols = !!report?.patrols?.length;


  const displayPriority = useMemo(() => {
    if (priority) return priority;
    if (!!report.priority) return report.priority;

    if (report.is_collection) {
      const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);
      if (!topRatedReportAndType) return report.priority;

      return (topRatedReportAndType.related_event && !!topRatedReportAndType.related_event.priority) ?
        topRatedReportAndType.related_event.priority
        : (topRatedReportAndType.event_type && !!topRatedReportAndType.event_type.default_priority) ?
          topRatedReportAndType.event_type.default_priority
          : report.priority;
    }

    return report.priority;
  }, [eventTypes, priority, report]);

  const displayTitle = title || displayTitleForEvent(report, eventTypes);

  const bounceIDs = report.is_collection ? getEventIdsForCollection(report) : [report.id];

  // Only fire bounce on the second and subsequent click of a jump. First
  // remove the existing ids so that redux can 'clear' the existing state.
  const onClick = () => {
    jumpToLocation(map, coordinates);
    if (locationClicked.current) {
      // clear the current prop, in the case where its the same ids
      setBounceEventIDs([]);
      setTimeout(() => {
        setBounceEventIDs(bounceIDs);
      }, 100);

    }
    locationClicked.current = true;
  };

  return <li title={displayTitle} className={`${styles.listItem} ${styles[`priority-${displayPriority}`]} ${className}`} key={key} {...rest}>
    <button role='img' type='button' className={styles.icon} onClick={() => iconClickHandler(report)}>
      <EventIcon report={report} />
      {hasPatrols && <span className={styles.patrolIndicator}>p</span>}
    </button>
    <span className={styles.serialNumber}>{report.serial_number}</span>
    <button type='button' className={styles.title} onClick={() => onTitleClick(report)}>{displayTitle}</button>
    <span className={styles.date}>
      <DateTime date={displayTime || report.updated_at || report.time} />
      {report.state === 'resolved' && <small className={styles.resolved}>resolved</small>}
    </span>
    {coordinates && !!coordinates.length && showJumpButton &&
      <LocationJumpButton isMulti={hasMultipleLocations}  map={map} coordinates={coordinates} onClick = {onClick}
        clickAnalytics={['Map Layers', 'Click Jump To Report Location button', `Report Type:${report.event_type}`]} />
    }
  </li>;
};

const mapStateToProps = (state) => ({ eventTypes: displayEventTypes(state) });
export default connect(mapStateToProps, { setBounceEventIDs })(memo(EventListItem));

EventListItem.defaultProps = {
  showJumpButton: true,
  showDate: true,
};

EventListItem.propTypes = {
  key: PropTypes.string,
  report: PropTypes.object.isRequired,
  map: PropTypes.object,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  showJumpButton: PropTypes.bool,
  showDate: PropTypes.bool,
};