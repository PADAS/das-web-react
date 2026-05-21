import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate as useReactNavigate, useParams } from 'react-router';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import Dropdown from 'react-bootstrap/Dropdown';

import { ReactComponent as ClipIcon } from '../common/images/icons/link.svg';
import { ReactComponent as PrinterIcon } from '../common/images/icons/printer-outline.svg';
import { ReactComponent as DownloadArrowIcon } from '../common/images/icons/download-arrow.svg';
import { ReactComponent as RestoreIcon } from '../common/images/icons/restore.svg';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as ChevronRightIcon } from '../common/images/icons/chevron-right.svg';
import PatrolTypeIcon from '../PatrolTypeIcon';
import { ReactComponent as TracksOffIcon } from '../common/images/icons/tracks_off.svg';
import { ReactComponent as TracksOnIcon } from '../common/images/icons/tracks_on.svg';

import KebabMenuIcon from '../KebabMenuIcon';
import ActivitySection from '../DetailViewComponents/ActivitySection';
import AddAttachmentButton from '../AddAttachmentButton';
import AddNoteButton from '../AddNoteButton';
import AddReportButton from '../DetailViewComponents/AddReportButton';
import LegBoundaryListItem from '../DetailViewComponents/ActivitySection/LegBoundaryListItem';
import PausedListItem from '../DetailViewComponents/ActivitySection/PausedListItem';

import useNavigate from '../hooks/useNavigate';
import { ASCENDING_SORT_ORDER, TAB_KEYS } from '../constants';
import { PATROL_DETAIL_VIEW_CATEGORY, TrackerContext, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../App';
import { fetchEvent } from '../ducks/events';
import { fetchPatrol } from '../ducks/patrols';
import { addPatrolSegmentToEvent } from '../utils/events';
import { uuid } from '../utils/string';
import { displayTitleForPatrol } from '../utils/patrols';

import { getLegs, stampLastLegEnded, subscribeLegs } from './legsStore';
import PatrolTracksLayer from './PatrolTracksLayer';
import TrackingDropdown from './TrackingDropdown';
import { addReportId, getAddedReportIds, subscribeAddedReports } from './addedReportsStore';
import { getPatrolTracks } from './patrolTracksStore';
import { setAllEntitiesVisible } from './trackVisibilityStore';
import { buildLegBoundaryItems } from './buildLegBoundaryItems';
import { getDemoNotes, getDemoEvents } from '../PatrolList/demoPatrols';
import PrototypeDemoNoteListItem from '../DetailViewComponents/ActivitySection/PrototypeDemoNoteListItem';
import PrototypeDemoEventListItem from '../DetailViewComponents/ActivitySection/PrototypeDemoEventListItem';
import { computeStatsForWindow, formatDuration } from './computePatrolStats';
import {
  endLastPauseSession,
  getPatrolStateEntry,
  setPatrolStateValue,
  startPauseSession,
  subscribePatrolState,
} from './patrolStateStore';
import { getUserPatrol, subscribeUserPatrols, updateUserPatrolTitle } from '../PatrolList/userPatrolsStore';
import EditableTitle from '../EditableTitle';

import * as styles from './styles.module.scss';

const tracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

const PROTOTYPE_EVENT_IDS = [
  '75267c50-fa84-44c9-9b2c-aa2e9675bdca',
  '1e982f30-eabb-4f19-b133-8aa140cfec00',
];

const PROTOTYPE_PATROL = {
  serial: '52',
  state: 'Active',
  events: 2,
  distance: '40k',
  duration: '30min',
  pausedTime: '2min',
  activeTime: '30min',
  currentLegLabel: 'Leg 1 — Vehicle Patrol',
  legs: [
    {
      index: 0,
      typeLabel: 'Vehicle Patrol',
      legNumber: 1,
      startTime: '13 April 2026 08:00',
      endTime: '13 April 2026 08:00',
      teamSummary: 'Maya Chen +3',
    },
    {
      index: 1,
      typeLabel: 'Foot Patrol',
      legNumber: 2,
      startTime: '13 April 2026 08:00',
      endTime: '13 April 2026 08:00',
      teamSummary: 'Maya Chen +1',
    },
  ],
};

const PROTOTYPE_DATES = {
  legStart: new Date('2026-04-13T08:00:00'),
  paused: new Date('2026-04-13T08:30:00'),
  legEnd: new Date('2026-04-13T08:32:00'),
};

// Global track toggle — starts 'on' (blue) so tracks are visible immediately
// when a patrol opens. Clicking cycles on → off → on and shows/hides all
// entity tracks for the patrol via the trackVisibilityStore.
const TrackToggleButton = ({ patrolId }) => {
  const [tracksOn, setTracksOn] = useState(true);

  const onToggle = useCallback(() => {
    const next = !tracksOn;
    setTracksOn(next);
    const names = Object.keys(getPatrolTracks(patrolId));
    setAllEntitiesVisible(patrolId, names, next);
  }, [patrolId, tracksOn]);

  const TrackIcon = tracksOn ? TracksOnIcon : TracksOffIcon;

  return <button
    type="button"
    className={`${styles.actionButton} ${styles.trackButton}`}
    aria-label={tracksOn ? 'Tracks on' : 'Tracks off'}
    onClick={onToggle}
    >
    <TrackIcon />
  </button>;
};

const Breadcrumb = ({ patrolTitle, onClose }) => <nav className={styles.breadcrumb} aria-label="Breadcrumb">
  <ol>
    <li>
      <Link to={`/${TAB_KEYS.PATROLS}`}>Patrols</Link>
      <ChevronRightIcon width={10} height={10} />
    </li>
    <li className={styles.current}>{patrolTitle}</li>
  </ol>

  <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
    <CrossIcon />
  </button>
</nav>;

const PATROL_STATE_STYLES = {
  Active: { background: '#3e35a3', color: 'white' },
  Paused: { background: '#d89b23', color: 'white' },
  Done: { background: '#888b8d', color: 'white' },
  Cancelled: { background: '#E7E7E7', color: '#888b8d' },
};

const formatPausedDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}min` : `${hrs}h`;
};

const PatrolMenuDropdown = ({ patrolState, onRestore }) => {
  const isTerminal = patrolState === 'Done' || patrolState === 'Cancelled';

  return <Dropdown align="end">
    <Dropdown.Toggle
      as="button"
      type="button"
      className={`${styles.actionButton} ${styles.kebabToggle}`}
      aria-label="More"
      bsPrefix="dropdown-toggle-clean"
    >
      <KebabMenuIcon />
    </Dropdown.Toggle>
    <Dropdown.Menu className={styles.kebabMenu}>
      {isTerminal && <Dropdown.Item onClick={onRestore} className={styles.kebabItem}>
        <RestoreIcon /> Restore Patrol
      </Dropdown.Item>}
      <Dropdown.Item className={styles.kebabItem}>
        <ClipIcon /> Copy Patrol Link
      </Dropdown.Item>
      <Dropdown.Item className={styles.kebabItem}>
        <PrinterIcon /> Print Patrol
      </Dropdown.Item>
      <Dropdown.Item className={styles.kebabItem}>
        <DownloadArrowIcon /> Download Patrol Track
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>;
};

const Header = ({ patrol, patrolId, patrolState, pausedTimeDisplay, onRestore, onFitToView, focusActive, title = 'Delta Patrol', currentPatrolType, editableTitle, onChangeTitle }) => <header className={styles.header}>
  <div className={styles.headerTop}>
    <div className={styles.iconBadge}>
      <PatrolTypeIcon patrolType={currentPatrolType} />
    </div>

    <div className={styles.titleBlock}>
      <div className={styles.titleRow}>
        <span className={styles.serial}>{patrol.serial}</span>
        {editableTitle
          ? <EditableTitle value={title} onChange={onChangeTitle} placeholder="New Patrol" />
          : <h2 className={styles.title}>{title}</h2>}
        <span
          className={styles.activeBadge}
          style={PATROL_STATE_STYLES[patrolState] || PATROL_STATE_STYLES.Active}
        >{patrolState}</span>
      </div>
      <span
        className={`${styles.currentLegLink} ${patrolState !== 'Active' ? styles.currentLegLinkMuted : ''}`}
      >
        {patrolState === 'Paused' ? 'Vehicle Patrol' : patrol.currentLegLabel}
      </span>
    </div>

    <div className={styles.headerActions}>
      <TrackToggleButton patrolId={patrolId} />
      <button
        type="button"
        className={styles.actionButton}
        aria-label="Fit to view"
        onClick={onFitToView}
        style={focusActive ? { backgroundColor: '#0056C7', color: 'white' } : undefined}
      >
        <FitScreenOutlinedIcon />
      </button>
      <PatrolMenuDropdown patrolState={patrolState} onRestore={onRestore} />
    </div>
  </div>

  <div className={styles.statsRow}>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Events</div>
      <div className={styles.statValue}>{patrol.events}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Distance</div>
      <div className={styles.statValue}>{patrol.distance}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Duration</div>
      <div className={styles.statValue}>{patrol.duration}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Paused Time</div>
      <div className={styles.statValue}>{pausedTimeDisplay}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Active Time</div>
      <div className={styles.statValue}>{patrol.activeTime}</div>
    </div>
  </div>
</header>;

const Tabs = ({ active, onChange }) => <div className={styles.tabs}>
  <button
    type="button"
    className={`${styles.tab} ${active === 'overview' ? styles.tabActive : ''}`}
    onClick={() => onChange('overview')}
  >
    Overview
  </button>
  <button
    type="button"
    className={`${styles.tab} ${active === 'history' ? styles.tabActive : ''}`}
    onClick={() => onChange('history')}
  >
    History
  </button>
</div>;

const LegsTable = ({ legs, patrolId }) => {
  const navigate = useReactNavigate();
  const goToLeg = (legIndex) => navigate(`/${TAB_KEYS.PATROLS}/${patrolId}/legs/${legIndex}`);

  return <div className={styles.legsTable}>
    <div className={`${styles.legsRow} ${styles.legsHeader}`}>
      <div className={styles.legsCellLeg}>Leg</div>
      <div className={styles.legsCellType}>Patrol Type</div>
      <div className={styles.legsCellDate}>Start Date</div>
      <div className={styles.legsCellDate}>End Date</div>
      <div className={styles.legsCellTeam}>Tracking</div>
      <div className={styles.legsCellActions} />
    </div>
    {legs.map((leg) => <div
      key={leg.index}
      className={styles.legsRow}
      onClick={() => goToLeg(leg.index)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') goToLeg(leg.index); }}
    >
      <div className={styles.legsCellLeg}>{leg.legNumber}</div>
      <div className={styles.legsCellType}>{leg.typeLabel}</div>
      <div className={styles.legsCellDate}>{leg.startTime}</div>
      <div className={styles.legsCellDate}>{leg.endTime}</div>
      <div className={styles.legsCellTeam}>
        <TrackingDropdown leg={leg} patrolId={patrolId} />
      </div>
      <div className={styles.legsCellActions}>
        <button
          type="button"
          className={styles.rowIconButton}
          aria-label="Fit to view"
          onClick={(e) => e.stopPropagation()}
        >
          <FitScreenOutlinedIcon />
        </button>
        <button
          type="button"
          className={styles.rowIconButton}
          aria-label="Open leg"
          onClick={(e) => { e.stopPropagation(); goToLeg(leg.index); }}
        >
          <ChevronRightOutlinedIcon />
        </button>
      </div>
    </div>)}
  </div>;
};

const PatrolOverview = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { id: patrolId } = useParams();
  const map = useContext(MapContext);

  const patrol = useSelector((state) => state.data.patrolStore[patrolId]);
  const eventStore = useSelector((state) => state.data.eventStore);

  const [addedReportsVersion, setAddedReportsVersion] = useState(0);
  useEffect(() => subscribeAddedReports(() => setAddedReportsVersion((v) => v + 1)), []);
  const addedReportIds = useMemo(
    () => getAddedReportIds(patrolId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patrolId, addedReportsVersion]
  );

  const [legsVersion, setLegsVersion] = useState(0);
  useEffect(() => subscribeLegs(() => setLegsVersion((v) => v + 1)), []);
  const legs = useMemo(() => getLegs(patrolId), [patrolId, legsVersion]);

  const [userPatrolsVersion, setUserPatrolsVersion] = useState(0);
  useEffect(() => subscribeUserPatrols(() => setUserPatrolsVersion((v) => v + 1)), []);
  const userPatrol = useMemo(
    () => getUserPatrol(patrolId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patrolId, userPatrolsVersion]
  );
  const isUserPatrol = !!userPatrol;

  const onAddReport = async (reportData) => {
    const { data: { data } } = Array.isArray(reportData) ? reportData[0] : reportData;
    if (!data?.id) return;

    // If the patrol still has an active (open-ended) leg, attribute the event
    // to that leg so it also appears in the leg's activity feed. Otherwise
    // (Done / Cancelled / no legs) save it patrol-scoped — overview only.
    const currentState = getPatrolStateEntry(patrolId).state;
    const patrolIsActive = currentState !== 'Done' && currentState !== 'Cancelled';
    const lastLeg = legs[legs.length - 1];
    const activeLegIndex = patrolIsActive && lastLeg && !lastLeg.endTime
      ? legs.length - 1
      : undefined;
    addReportId(patrolId, activeLegIndex, data.id);

    // Link the event to the first patrol segment so it shows up in this patrol's activity
    const segmentId = patrol?.patrol_segments?.[0]?.id;
    if (segmentId) {
      try {
        await addPatrolSegmentToEvent(segmentId, data.id);
        await dispatch(fetchPatrol(patrolId));
      } catch (e) {

        console.warn('Failed to link event to patrol segment', e);
      }
    }
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [notesToAdd, setNotesToAdd] = useState([]);

  const [patrolStateVersion, setPatrolStateVersion] = useState(0);
  useEffect(() => subscribePatrolState(() => setPatrolStateVersion((v) => v + 1)), []);
  const { state: patrolState, pauseSessions, endedAt: patrolEndedAt } = useMemo(
    () => getPatrolStateEntry(patrolId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patrolId, patrolStateVersion]
  );

  const isTerminal = patrolState === 'Done' || patrolState === 'Cancelled';
  const isPaused = patrolState === 'Paused';

  // Live patrol-window stats: duration is from the first leg's start through
  // either the patrol's end (if Done) or now. Paused / Active derive from
  // accumulated pause sessions.
  const patrolStats = useMemo(() => {
    const now = new Date();
    const windowStart = legs[0]?.startedAt || null;
    const windowEnd = patrolEndedAt || legs[legs.length - 1]?.endedAt || now;
    return computeStatsForWindow({
      windowStart,
      windowEnd,
      pauseSessions,
      patrolIsPaused: isPaused,
      now,
    });
  }, [legs, pauseSessions, patrolEndedAt, isPaused]);

  const pausedTimeDisplay = formatDuration(Math.round(patrolStats.pausedMs / 1000));
  const durationDisplay = formatDuration(Math.round(patrolStats.durationMs / 1000));
  const activeTimeDisplay = formatDuration(Math.round(patrolStats.activeMs / 1000));

  // (Live simulation removed — demo patrols come pre-seeded with track data
  // via demoPatrols.js so tracks render immediately.)

  // Whether the focus (fit-to-view) button is in its active/blue state.
  const [focusActive, setFocusActive] = useState(false);
  // Ref to the movestart listener so we can remove it on cleanup / re-fire.
  const focusMoveListenerRef = useRef(null);

  // Fit the map to the full extent of this patrol's tracks, offset so the
  // tracks land in the visible area to the right of the patrol panel.
  // For active patrols this covers start → current subject positions;
  // for done patrols it covers the complete route start → end.
  const onFitToView = useCallback(() => {
    if (!map) return;
    const tracks = getPatrolTracks(patrolId);
    const allPts = Object.values(tracks).flatMap((pts) => pts || []);
    if (!allPts.length) return;
    let minLng = +Infinity, minLat = +Infinity, maxLng = -Infinity, maxLat = -Infinity;
    allPts.forEach((p) => {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    });
    try {
      // Left padding matches the panel width (46rem ≈ 736px) so the tracks
      // are shown in the visible map area rather than under the panel.
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: { left: 756, top: 80, right: 80, bottom: 80 },
        duration: 800,
        maxZoom: 15,
      });
    } catch (_e) { /* ignore */ }

    // Button turns blue; clears when the user manually pans or zooms.
    setFocusActive(true);

    // Remove any previous listener before adding a new one.
    if (focusMoveListenerRef.current) {
      try { map.off('movestart', focusMoveListenerRef.current); } catch (_e) { /* ignore */ }
    }
    const onUserMove = (e) => {
      if (e.originalEvent) {
        setFocusActive(false);
        map.off('movestart', onUserMove);
        focusMoveListenerRef.current = null;
      }
    };
    focusMoveListenerRef.current = onUserMove;
    map.on('movestart', onUserMove);
  }, [map, patrolId]);

  // Clean up the map listener when the component unmounts or patrolId changes.
  useEffect(() => () => {
    if (focusMoveListenerRef.current && map) {
      try { map.off('movestart', focusMoveListenerRef.current); } catch (_e) { /* ignore */ }
    }
  }, [map, patrolId]);

  const onEnd = () => {
    // Stamp the active leg's end + mark patrol Done (so the feed shows both
    // a "Leg N <Patrol Type> Ended" item and a "Patrol has ended" item).
    stampLastLegEnded(patrolId);
    setPatrolStateValue(patrolId, 'Done');
  };
  const onCancel = () => setPatrolStateValue(patrolId, 'Cancelled');
  const onPause = () => startPauseSession(patrolId);
  const onResume = () => endLastPauseSession(patrolId);
  const onRestore = () => setPatrolStateValue(patrolId, 'Active');

  useEffect(() => {
    PROTOTYPE_EVENT_IDS.forEach((id) => {
      if (!eventStore[id]) dispatch(fetchEvent(id));
    });
    // Refetch any reports that were saved earlier so they re-appear after a
    // full page reload (eventStore is in-memory Redux; ids live in sessionStorage).
    addedReportIds.forEach((id) => {
      if (!eventStore[id]) dispatch(fetchEvent(id));
    });
    if (patrolId) dispatch(fetchPatrol(patrolId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, patrolId, addedReportIds]);


  const onAddNote = () => {
    setNotesToAdd((prev) => [...prev, {
      creationDate: new Date().toISOString(),
      text: '',
      tmpId: uuid(),
    }]);
  };

  const onChangeNote = (originalNote, { target: { value } }) => {
    const edited = { ...originalNote, text: value };
    setNotesToAdd((prev) => prev.map((n) => n === originalNote ? edited : n));
    return edited;
  };

  const onDeleteNote = (note) => setNotesToAdd((prev) => prev.filter((n) => n !== note));
  const onCancelNote = (note) => setNotesToAdd((prev) => prev.map((n) =>
    n === note ? { ...n, text: n.originalText || '' } : n
  ));
  const onDoneNote = (note) => setNotesToAdd((prev) => prev.map((n) =>
    n === note ? { ...n, originalText: n.text } : n
  ));

  const patrolTitle = isUserPatrol
    ? userPatrol.title
    : (patrol ? displayTitleForPatrol(patrol) : 'Patrol');
  const onClose = () => navigate(`/${TAB_KEYS.PATROLS}`);

  // Jump the map to the nearest track position at a given date/time.
  // Used by leg boundary items to let the user jump to where the patrol
  // was at each leg transition.
  const jumpToDate = useCallback((date) => {
    if (!map) return;
    const tracks = getPatrolTracks(patrolId);
    const targetMs = new Date(date).getTime();
    let best = null;
    let bestDiff = Infinity;
    Object.values(tracks).forEach((pts) => {
      if (!pts?.length) return;
      pts.forEach((p) => {
        if (!p.time) return;
        const diff = Math.abs(new Date(p.time).getTime() - targetMs);
        if (diff < bestDiff) { bestDiff = diff; best = p; }
      });
    });
    if (best) {
      try { map.easeTo({ center: [best.lng, best.lat], zoom: 15, speed: 200 }); } catch (_e) { /* ignore */ }
    }
  }, [map, patrolId]);

  const extraItems = useMemo(() => {
    const pauseNodes = pauseSessions.map((s) => ({
      sortDate: s.start,
      node: <PausedListItem
        key={s.id}
        date={s.start}
        durationLabel={s.end ? formatPausedDuration(Math.round((s.end - s.start) / 1000)) : null}
      />,
    }));

    // Derive leg start/end markers from the actual legs store so they
    // reflect new legs as they're created.
    const boundaryItems = buildLegBoundaryItems(legs, { jumpToDate });

    // Patrol-ended marker (added when the user presses End on the overview).
    const patrolEndedItems = patrolEndedAt ? [{
      sortDate: patrolEndedAt,
      node: <LegBoundaryListItem
        key="patrol-ended"
        date={patrolEndedAt}
        title="Patrol has ended"
        onJumpToLocation={() => jumpToDate(patrolEndedAt)}
      />,
    }] : [];

    // Demo notes — shown using the note-specific list item (grey icon + text).
    const demoNotes = getDemoNotes(patrolId).map((n) => ({
      sortDate: new Date(n.time),
      node: <PrototypeDemoNoteListItem key={n.id} note={n} />,
    }));

    // Demo events — rendered inline in the activity feed sorted by time.
    const demoEvents = getDemoEvents(patrolId).map((ev) => ({
      sortDate: new Date(ev.time),
      node: <PrototypeDemoEventListItem
        key={ev.id}
        event={ev}
        onJumpToLocation={ev.lat && ev.lng ? () => jumpToDate(ev.time) : undefined}
      />,
    }));

    return [...boundaryItems, ...pauseNodes, ...patrolEndedItems, ...demoNotes, ...demoEvents];
  }, [pauseSessions, legs, patrolEndedAt, patrolId, jumpToDate]);

  const containedReports = useMemo(() => {
    const protoReports = isUserPatrol
      ? []
      : PROTOTYPE_EVENT_IDS.map((id) => eventStore[id]).filter(Boolean);
    // Pull events from the real patrol's segments (these include events saved via the Event button)
    const segmentEvents = isUserPatrol
      ? []
      : (patrol?.patrol_segments ?? []).flatMap((s) => Array.isArray(s.events) ? s.events : []);
    const liveAdded = addedReportIds.map((id) => eventStore[id]).filter(Boolean);

    const seen = new Set();
    return [...protoReports, ...segmentEvents, ...liveAdded].filter((r) => {
      if (!r?.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [eventStore, patrol, addedReportIds, isUserPatrol]);

  return <div className={styles.patrolOverview}>
    <PatrolTracksLayer patrolId={patrolId} />
    <TrackerContext.Provider value={tracker}>
      <Breadcrumb patrolTitle={patrolTitle} onClose={onClose} />

      <div className={styles.body}>
        <Header
          patrol={{
            serial: isUserPatrol ? userPatrol.serial : PROTOTYPE_PATROL.serial,
            // All four stats below are computed from real activity data.
            events: containedReports.length,
            distance: isUserPatrol ? '0 km' : PROTOTYPE_PATROL.distance,
            duration: durationDisplay,
            activeTime: activeTimeDisplay,
            // Track the actual current (last) leg from the store so the summary
            // updates when a new leg is added.
            currentLegLabel: legs.length
              ? `Leg ${legs.length} — ${legs[legs.length - 1].typeLabel}`
              : (isUserPatrol
                ? `Leg 1 — ${userPatrol.patrolType}`
                : PROTOTYPE_PATROL.currentLegLabel),
          }}
          patrolId={patrolId}
          patrolState={patrolState}
          pausedTimeDisplay={pausedTimeDisplay}
          onRestore={onRestore}
          onFitToView={onFitToView}
          focusActive={focusActive}
          title={isUserPatrol ? userPatrol.title : 'Delta Patrol'}
          editableTitle={isUserPatrol}
          onChangeTitle={(v) => updateUserPatrolTitle(patrolId, v)}
          currentPatrolType={legs.length
            ? legs[legs.length - 1].typeLabel
            : (isUserPatrol ? userPatrol.patrolType : 'Vehicle Patrol')}
        />
        <Tabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && <>
          <section className={styles.section}>
            <LegsTable legs={legs} patrolId={patrolId} />
          </section>

          <section className={styles.section}>
            <ActivitySection
              attachments={[]}
              attachmentsToAdd={[]}
              containedReports={containedReports}
              defaultSortOrder={ASCENDING_SORT_ORDER}
              extraItems={extraItems}
              notes={[]}
              notesToAdd={notesToAdd}
              onCancelNote={onCancelNote}
              onChangeNote={onChangeNote}
              onDeleteAttachment={() => {}}
              onDeleteNote={onDeleteNote}
              onDoneNote={onDoneNote}
            />

            <div className={styles.activityActions}>
              <AddNoteButton className={styles.activityActionButton} onAddNote={onAddNote} />
              <AddAttachmentButton className={styles.activityActionButton} onAddAttachments={() => {}} />
              <AddReportButton
                className={styles.activityActionButton}
                analyticsMetadata={{ category: PATROL_DETAIL_VIEW_CATEGORY, location: 'Patrol Overview' }}
                formProps={{
                  isPatrolReport: true,
                  onSaveSuccess: onAddReport,
                  // After save (or cancel), navigate back to this patrol overview.
                  redirectTo: [
                    { pathname: location.pathname, search: location.search },
                    { state: location.state },
                  ],
                }}
              />
            </div>
          </section>
        </>}

        {activeTab === 'history' && <section className={styles.section}>
          <p className={styles.historyPlaceholder}>History view (not implemented in prototype)</p>
        </section>}
      </div>

      {!isTerminal && !isPaused && <div className={styles.stickyFooter}>
        <button type="button" className={styles.endButton} onClick={onEnd}>
          <StopCircleOutlinedIcon /> <span>End</span>
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          <CancelOutlinedIcon /> <span>Cancel</span>
        </button>
        <button type="button" className={styles.pauseButton} onClick={onPause}>
          <PauseOutlinedIcon /> <span>Pause</span>
        </button>
        <button
          type="button"
          className={styles.newLegButton}
          onClick={() => navigate(`/${TAB_KEYS.PATROLS}/${patrolId}/legs/new?newLeg=1`)}
        >
          <AddOutlinedIcon /> <span>New Patrol Leg</span>
        </button>
      </div>}

      {isPaused && <div className={styles.stickyFooter}>
        <button type="button" className={styles.newLegButton} onClick={onResume}>
          <PlayCircleOutlinedIcon /> <span>Resume Patrol</span>
        </button>
      </div>}
    </TrackerContext.Provider>
  </div>;
};

export default memo(PatrolOverview);
