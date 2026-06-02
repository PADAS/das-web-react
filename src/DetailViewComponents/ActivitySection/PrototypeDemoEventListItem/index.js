import React, { memo, useCallback, useMemo, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as PlaceIcon } from '../../../common/images/icons/place.svg';

import { createEvent } from '../../../ducks/events';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';

import ItemActionButton from '../ItemActionButton';
import ReportListItem from '../../../ReportListItem';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

// sessionStorage cache so the same demo event doesn't get created twice.
const CACHE_KEY = 'er-proto-created-event-ids-v1';

const getCachedId = (demoId) => {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}')[demoId] || null;
  } catch (_e) { return null; }
};

const setCachedId = (demoId, realId) => {
  try {
    const map = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...map, [demoId]: realId }));
  } catch (_e) { /* ignore */ }
};

// Convert snake_case / camelCase keys into readable labels.
const formatLabel = (key) => key
  .replace(/_/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (c) => c.toUpperCase());

const PrototypeDemoEventListItem = ({ event, onJumpToLocation }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Build a report-shaped object so ReportListItem can look up the real icon
  // and priority colour from the Redux event-types store.
  const mockReport = useMemo(() => ({
    id: event.id,
    event_type: event.event_type,
    priority: event.priority ?? 0,
    title: event.title,
    time: event.time,
    updated_at: event.time,
    is_collection: false,
    contains: [],
    patrols: [],
    geojson: event.lat && event.lng
      ? { type: 'Feature', geometry: { type: 'Point', coordinates: [event.lng, event.lat] }, properties: {} }
      : null,
  }), [event]);

  // Clicking the row creates the event in the API (once) and navigates to it.
  // Subsequent clicks reuse the cached real event ID.
  const onRowClick = useCallback(async () => {
    if (creating) return;

    const cached = getCachedId(event.id);
    if (cached) {
      navigate(`/${TAB_KEYS.EVENTS}/${cached}`, { state: { returnTo: location.pathname } });
      return;
    }

    setCreating(true);
    try {
      const response = await dispatch(createEvent({
        event_type: event.event_type,
        title: event.title,
        priority: event.priority ?? 0,
        time: event.time,
        location: event.lat && event.lng
          ? { latitude: event.lat, longitude: event.lng }
          : null,
        event_details: event.event_details || {},
      }));

      const realId = response?.data?.data?.id;
      if (realId) {
        setCachedId(event.id, realId);
        navigate(`/${TAB_KEYS.EVENTS}/${realId}`, { state: { returnTo: location.pathname } });
      } else {
        // No ID returned — fall back to inline expand.
        setIsOpen((v) => !v);
      }
    } catch (_e) {
      // API error — fall back to inline expand so the user still sees details.
      setIsOpen((v) => !v);
    } finally {
      setCreating(false);
    }
  }, [creating, dispatch, event, location.pathname, navigate]);

  // Chevron toggles the inline collapse without triggering row navigation.
  const onChevronClick = useCallback((e) => {
    e.stopPropagation();
    setIsOpen((v) => !v);
  }, []);

  // Jump button zooms the map without triggering row navigation.
  const onClickJump = useCallback((e) => {
    e.stopPropagation();
    onJumpToLocation?.();
  }, [onJumpToLocation]);

  const detailEntries = useMemo(() => {
    const details = event.event_details || {};
    return Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== '');
  }, [event.event_details]);

  return <li>
    <div
      className={`${activitySectionStyles.itemRow} ${activitySectionStyles.collapseRow}`}
      onClick={onRowClick}
      style={creating ? { opacity: 0.6, cursor: 'wait' } : undefined}
    >
      <ReportListItem
        className={styles.reportListItem}
        report={mockReport}
        showElapsedTime={false}
        showJumpButton={false}
      />

      <div className={activitySectionStyles.itemActionButtonContainer}>
        {onJumpToLocation && (
          <ItemActionButton onClick={onClickJump} tooltip="Jump to location">
            <PlaceIcon />
          </ItemActionButton>
        )}
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <ItemActionButton onClick={onChevronClick}>
          {isOpen
            ? <ArrowUpSimpleIcon />
            : <ArrowDownSimpleIcon />}
        </ItemActionButton>
      </div>
    </div>

    <Collapse className={activitySectionStyles.collapse} in={isOpen}>
      <div>
        <div className={styles.detailsBody}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Report type</span>
            <span className={styles.detailValue}>{event.eventTypeName}</span>
          </div>
          {detailEntries.map(([key, value]) => (
            <div key={key} className={styles.detailRow}>
              <span className={styles.detailLabel}>{formatLabel(key)}</span>
              <span className={styles.detailValue}>
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Collapse>
  </li>;
};

export default memo(PrototypeDemoEventListItem);
