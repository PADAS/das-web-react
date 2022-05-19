import React, { memo, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import FeedListItem from '../FeedListItem';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import LocationJumpButton from '../LocationJumpButton';

import { displayEventTypes } from '../selectors/event-types';

import { getCoordinatesForEvent, getCoordinatesForCollection, collectionHasMultipleValidLocations,
  displayTitleForEvent, getEventIdsForCollection, PRIORITY_COLOR_MAP } from '../utils/events';
import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { setBounceEventIDs } from '../ducks/map-ui';
import { MAP_LAYERS_CATEGORY } from '../utils/analytics';
import useJumpToLocation from '../hooks/useJumpToLocation';

import styles from './styles.module.scss';

const ReportListItem = ({ eventTypes, displayTime = null, title = null, report, onTitleClick = () => {}, setBounceEventIDs, onIconClick = onTitleClick, showJumpButton = true, className, dispatch: _dispatch, ...rest }) => {
  const jumpToLocation = useJumpToLocation();

  const coordinates = report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report);
  const hasMultipleLocations = collectionHasMultipleValidLocations(report);


  const locationClicked = useRef(false);

  const iconClickHandler = onIconClick || onTitleClick;
  const hasPatrols = !!report?.patrols?.length;

  const theme = useMemo(() => {
    const reportToConsider = report.is_collection
      ? calcTopRatedReportAndTypeForCollection(report, eventTypes)?.related_event
      : report;

    return PRIORITY_COLOR_MAP[reportToConsider?.priority] || PRIORITY_COLOR_MAP['0'];
  }, [eventTypes, report]);

  const { base: themeColor, background: themeBgColor } = theme;

  const displayTitle = title || displayTitleForEvent(report, eventTypes);

  const bounceIDs = report.is_collection ? getEventIdsForCollection(report) : [report.id];

  // Only fire bounce on the second and subsequent click of a jump. First
  // remove the existing ids so that redux can 'clear' the existing state.
  const onClick = () => {
    jumpToLocation(coordinates);
    if (locationClicked.current) {
      // clear the current prop, in the case where its the same ids
      setBounceEventIDs([]);
      setTimeout(() => {
        setBounceEventIDs(bounceIDs);
      }, 100);

    }
    locationClicked.current = true;
  };

  const dateTimeProp = displayTime || report.updated_at || report.time;

  return <FeedListItem
    title={displayTitle} className={`${className}`}
    themeBgColor={themeBgColor}
    themeColor={themeColor}
    IconComponent={
      <button className={styles.icon} type='button' onClick={() => iconClickHandler(report)}>
        <EventIcon report={report} />
        {hasPatrols && <span className={styles.patrolIndicator}>p</span>}
      </button>
    }
    TitleComponent={
      <>
        <span className={styles.serialNumber}>{report.serial_number}</span>
        <button className={styles.title} type='button' onClick={() => onTitleClick(report)}>{displayTitle}</button>
      </>
    }
    DateComponent={dateTimeProp && <span>
      <DateTime date={dateTimeProp} suffix='ago'/>
        {report.state === 'resolved' && <small className={styles.resolved}>resolved</small>}
      </span>}
    ControlsComponent={coordinates && !!coordinates.length && showJumpButton &&
      <LocationJumpButton
        isMulti={hasMultipleLocations}
        coordinates={coordinates}
        onClick={onClick}
        clickAnalytics={[MAP_LAYERS_CATEGORY, 'Click Jump To Report Location button', `Report Type:${report.event_type}`]} />
      }
      {...rest}
  />;
};

const mapStateToProps = (state) => ({ eventTypes: displayEventTypes(state) });
export default connect(mapStateToProps, { setBounceEventIDs })(memo(ReportListItem));

ReportListItem.propTypes = {
  report: PropTypes.object.isRequired,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  showJumpButton: PropTypes.bool,
};