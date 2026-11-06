import { memo, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  collectionHasMultipleValidLocations,
  getEventIdsForCollection,
} from '../utils/events';
import { MAP_LAYERS_CATEGORY } from '../utils/analytics';
import { setBounceEventIDs } from '../ducks/map-ui';
import { PRIORITY_COLOR_MAP, tokenVar } from '../utils/colors';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useReport from '../hooks/useReport';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import FeedListItem from '../FeedListItem';
import LocationJumpButton from '../LocationJumpButton';

import * as styles from './styles.module.scss';

const HOVER_EFFECTS = {
  300: styles.highPriority,
  200: styles.mediumPriority,
  100: styles.lowPriority,
  0: styles.noPriority,
};

const ReportListItem = ({
  className = '',
  Component = 'li',
  displayTime = null,
  onIconClick = null,
  onTitleClick = null,
  report,
  showElapsedTime = true,
  showJumpButton = true,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportListItem' });

  const locationClicked = useRef(false);

  const { coordinates, displayPriority, displayTitle } = useReport(report);
  const jumpToLocation = useJumpToLocation();

  const priorityColors = PRIORITY_COLOR_MAP[`${displayPriority}`] || PRIORITY_COLOR_MAP['0'];

  const dateTime = displayTime || report.updated_at || report.time;
  const iconClickHandler = onIconClick || onTitleClick;
  // With nothing to press they stay text, as a link may wrap the whole item.
  const IconElement = iconClickHandler ? 'button' : 'span';
  const TitleElement = onTitleClick ? 'button' : 'span';
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
    Component={Component}
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

      {(report.state === 'resolved' || report.state === 'review') && <small className={styles[report.state]}>{t(`${report.state}State`)}</small>}
    </span>}
    IconComponent={<IconElement
      className={styles.icon}
      onClick={iconClickHandler ? () => iconClickHandler(report) : undefined}
      type={iconClickHandler ? 'button' : undefined}
    >
      <EventIcon report={report} />

      {hasPatrols && <span className={styles.patrolIndicator}>p</span>}
    </IconElement>}
    onClick={() => onTitleClick?.(report)}
    themeBgColor={tokenVar(priorityColors.backgroundToken)}
    themeColor={tokenVar(priorityColors.baseToken)}
    title={displayTitle}
    TitleComponent={<>
      <span className={styles.serialNumber}>{report.serial_number}</span>

      <TitleElement className={styles.title} type={onTitleClick ? 'button' : undefined}>{displayTitle}</TitleElement>
    </>}
  />;
};

export default memo(ReportListItem);
