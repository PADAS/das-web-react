import React, { memo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  collectionHasMultipleValidLocations,
  getEventIdsForCollection,
  PRIORITY_COLOR_MAP,
} from '../utils/events';
import { MAP_LAYERS_CATEGORY } from '../utils/analytics';
import { setBounceEventIDs } from '../ducks/map-ui';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useReport from '../hooks/useReport';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import FeedListItem from '../FeedListItem';
import LocationJumpButton from '../LocationJumpButton';

import styles from './styles.module.scss';

const HOVER_EFFECTS = {
  300: styles.highPriority,
  200: styles.mediumPriority,
  100: styles.lowPriority,
  0: styles.noPriority,
};

const ReportListItem = ({
  className,
  displayTime,
  onIconClick,
  onTitleClick,
  report,
  showElapsedTime,
  showJumpButton,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportListItem' });

  const locationClicked = useRef(false);

  const { coordinates, displayPriority, displayTitle } = useReport(report);
  const jumpToLocation = useJumpToLocation();

  const {
    base: themeColor,
    background: themeBgColor,
  } = PRIORITY_COLOR_MAP[`${displayPriority}`] || PRIORITY_COLOR_MAP['0'];

  const dateTime = displayTime || report.updated_at || report.time;
  const iconClickHandler = onIconClick || onTitleClick;
  const hasMultipleLocations = collectionHasMultipleValidLocations(report);
  const hasPatrols = !!report?.patrols?.length;

  // Only fire bounce on the second and subsequent click of a jump. First
  // remove the existing ids so that redux can 'clear' the existing state.
  const onClickLocationJumpButton = useCallback((event) => {
    event.stopPropagation();
    jumpToLocation(coordinates);

    if (locationClicked.current) {
      // clear the current prop, in the case where its the same ids
      setBounceEventIDs([]);

      const bounceIDs = report.is_collection ? getEventIdsForCollection(report) : [report.id];
      setTimeout(() => dispatch(setBounceEventIDs(bounceIDs)), 100);
    }

    locationClicked.current = true;
  }, [coordinates, dispatch, jumpToLocation, report]);

  return <FeedListItem
    className={`${HOVER_EFFECTS[displayPriority]} ${className}`}
    ControlsComponent={coordinates && !!coordinates.length && showJumpButton ? <LocationJumpButton
      clickAnalytics={[
        MAP_LAYERS_CATEGORY,
        'Click Jump To Report Location button',
        `Report Type:${report.event_type}`,
      ]}
      coordinates={coordinates}
      isMulti={hasMultipleLocations}
      onClick={onClickLocationJumpButton}
    /> : undefined}
    DateComponent={dateTime && <span className={styles.dateComponent}>
      <DateTime date={dateTime} showElapsed={showElapsedTime} suffix={t('dateTimeSuffix')}/>

      {report.state === 'resolved' && <small className={styles.resolved}>{t('resolvedState')}</small>}
    </span>}
    IconComponent={<button className={styles.icon} onClick={() => iconClickHandler?.(report)} type="button">
      <EventIcon report={report} />

      {hasPatrols && <span className={styles.patrolIndicator}>p</span>}
    </button>}
    onClick={() => onTitleClick?.(report)}
    themeBgColor={themeBgColor}
    themeColor={themeColor}
    title={displayTitle}
    TitleComponent={<>
      <span className={styles.serialNumber}>{report.serial_number}</span>

      <button className={styles.title} type="button">{displayTitle}</button>
    </>}
  />;
};

ReportListItem.defaultProps = {
  className: '',
  displayTime: null,
  onIconClick: null,
  onTitleClick: null,
  showElapsedTime: true,
  showJumpButton: true,
};

ReportListItem.propTypes = {
  className: PropTypes.string,
  displayTime: PropTypes.string,
  onIconClick: PropTypes.func,
  onTitleClick: PropTypes.func,
  report: PropTypes.object.isRequired,
  showElapsedTime: PropTypes.bool,
  showJumpButton: PropTypes.bool,
};

export default memo(ReportListItem);
