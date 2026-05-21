import React, { memo, useCallback, useMemo } from 'react';

import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as PlaceIcon } from '../../../common/images/icons/place.svg';

import DateTime from '../../../DateTime';
import ItemActionButton from '../ItemActionButton';
import ReportListItem from '../../../ReportListItem';
import useJumpToLocation from '../../../hooks/useJumpToLocation';
import useNavigate from '../../../hooks/useNavigate';
import { TAB_KEYS } from '../../../constants';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const PrototypeEventListItem = ({ event }) => {
  const navigate = useNavigate();
  const jumpToLocation = useJumpToLocation();

  const hasLocation = event.lat != null && event.lng != null;

  const onGoToEvent = useCallback((e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/${TAB_KEYS.EVENTS}/${event.id}`);
  }, [event.id, navigate]);

  const onJumpToLocation = useCallback((e) => {
    e.stopPropagation();
    jumpToLocation([event.lng, event.lat]);
  }, [event.lat, event.lng, jumpToLocation]);

  // Shape the demo event into the minimal report object that ReportListItem + useReport expect.
  // useReport reads: report.title, report.priority, report.event_type (icon lookup),
  // report.geometry.coordinates (for jump), report.serial_number.
  const fakeReport = useMemo(() => ({
    id: event.id,
    title: event.title,
    serial_number: event.serial,
    event_type: event.event_type || null,
    is_collection: false,
    patrol_segments: [],
    priority: event.priority ?? 0,
    geometry: hasLocation
      ? { type: 'Point', coordinates: [event.lng, event.lat] }
      : null,
    time: event.time,
    updated_at: event.time,
  }), [event, hasLocation]);

  return <li>
    <div
      className={`${activitySectionStyles.itemRow} ${activitySectionStyles.collapseRow}`}
      onClick={onGoToEvent}
    >
      <ReportListItem
        className={styles.reportListItem}
        report={fakeReport}
        showElapsedTime={false}
        showJumpButton={false}
        onIconClick={onGoToEvent}
        onTitleClick={onGoToEvent}
      />

      {hasLocation && <div className={activitySectionStyles.itemActionButtonContainer}>
        <ItemActionButton onClick={onJumpToLocation} tooltip='Jump to location'>
          <PlaceIcon />
        </ItemActionButton>
      </div>}

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <ItemActionButton onClick={onGoToEvent} tooltip='View event'>
          <ArrowIntoIcon />
        </ItemActionButton>
      </div>
    </div>
  </li>;
};

export default memo(PrototypeEventListItem);
