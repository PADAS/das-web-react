import React, { memo, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import FeedListItem from '../FeedListItem';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import LocationJumpButton from '../LocationJumpButton';

import { displayEventTypes } from '../selectors/event-types';

import { getCoordinatesForEvent, getCoordinatesForCollection, collectionHasMultipleValidLocations,
  displayTitleForEvent, getEventIdsForCollection } from '../utils/events';
import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { setBounceEventIDs } from '../ducks/map-ui';
import { jumpToLocation } from '../utils/map';

import colorVariables from '../common/styles/vars/colors.module.scss';

import styles from './styles.module.scss';

const PRIORITY_COLOR_MAP = {
  300: colorVariables.red,
  200: colorVariables.amber,
  100: colorVariables.green,
  0: colorVariables.gray,
};

const ReportListItem = (props) => {
  const { eventTypes, displayTime = null, title = null, map, report, onTitleClick = () => {}, setBounceEventIDs, onIconClick = onTitleClick, showJumpButton = true, className, dispatch: _dispatch, ...rest } = props;

  const coordinates = report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report);
  const hasMultipleLocations = collectionHasMultipleValidLocations(report);


  const locationClicked = useRef(false);

  const iconClickHandler = onIconClick || onTitleClick;
  const hasPatrols = !!report?.patrols?.length;


  const themeColor = useMemo(() => {
    const reportToConsider = report.is_collection ? calcTopRatedReportAndTypeForCollection(report, eventTypes) : report;

    return PRIORITY_COLOR_MAP[reportToConsider.priority] || colorVariables.gray;

  }, [eventTypes, report]);

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

  const dateTimeProp = displayTime || report.updated_at || report.time;

  return <FeedListItem
    title={displayTitle} className={`${className}`}
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
      <DateTime date={dateTimeProp} />
        {report.state === 'resolved' && <small className={styles.resolved}>resolved</small>}
      </span>}
    ControlsComponent={coordinates && !!coordinates.length && showJumpButton &&
      <LocationJumpButton
        isMulti={hasMultipleLocations}
        map={map} coordinates={coordinates} onClick={onClick}
        clickAnalytics={['Map Layers', 'Click Jump To Report Location button', `Report Type:${report.event_type}`]} />
      }
      {...rest}
  />;
};

const mapStateToProps = (state) => ({ eventTypes: displayEventTypes(state) });
export default connect(mapStateToProps, { setBounceEventIDs })(memo(ReportListItem));

ReportListItem.propTypes = {
  report: PropTypes.object.isRequired,
  map: PropTypes.object,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  showJumpButton: PropTypes.bool,
};