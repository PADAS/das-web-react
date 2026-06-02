import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate as useReactNavigate, useParams } from 'react-router';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Collapsible from 'react-collapsible';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as ChevronRightIcon } from '../common/images/icons/chevron-right.svg';
import { ReactComponent as PlaceIcon } from '../common/images/icons/place.svg';
import { ReactComponent as PhoneIphoneIcon } from '../common/images/icons/phone-iphone.svg';
import PatrolTypeIcon from '../PatrolTypeIcon';
import { ReactComponent as TracksOffIcon } from '../common/images/icons/tracks_off.svg';
import { ReactComponent as TracksOnIcon } from '../common/images/icons/tracks_on.svg';
import { ReactComponent as TracksPinnedIcon } from '../common/images/icons/tracks_pinned.svg';
import { ReactComponent as MarkerFeedIcon } from '../common/images/icons/marker-feed.svg';
import { ReactComponent as PencilIcon } from '../common/images/icons/pencil.svg';

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
import { fetchEvent } from '../ducks/events';
import { fetchPatrol } from '../ducks/patrols';
import { addPatrolSegmentToEvent } from '../utils/events';
import { uuid } from '../utils/string';
import {
  actualEndTimeForPatrol,
  actualStartTimeForPatrol,
  displayTitleForPatrol,
} from '../utils/patrols';

import { MapContext } from '../App';
import { getLegs, subscribeLegs } from '../PatrolOverview/legsStore';
import { getPatrolTracks } from '../PatrolOverview/patrolTracksStore';
import { addReportId, getAddedReportIds, subscribeAddedReports } from '../PatrolOverview/addedReportsStore';
import { buildLegBoundaryItems } from '../PatrolOverview/buildLegBoundaryItems';
import { getDemoNotes, getDemoEvents } from '../PatrolList/demoPatrols';
import PrototypeDemoNoteListItem from '../DetailViewComponents/ActivitySection/PrototypeDemoNoteListItem';
import PrototypeDemoEventListItem from '../DetailViewComponents/ActivitySection/PrototypeDemoEventListItem';
import { computeStatsForWindow, formatDuration } from '../PatrolOverview/computePatrolStats';
import { getPatrolStateEntry, subscribePatrolState } from '../PatrolOverview/patrolStateStore';
import { getUserPatrol, subscribeUserPatrols } from '../PatrolList/userPatrolsStore';

import * as styles from './styles.module.scss';

const tracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

const PROTOTYPE_EVENT_IDS = [
  '75267c50-fa84-44c9-9b2c-aa2e9675bdca',
  '1e982f30-eabb-4f19-b133-8aa140cfec00',
];

const PROTOTYPE_LEG = {
  events: 2,
  distance: '35k',
  duration: '32min',
  pausedTime: '2min',
  activeTime: '30min',
  startTimeText: '13 April 2026 08:00',
  endTimeText: '13 April 2026 08:32',
  startLocation: '-127.122150°,  -109.375161°',
  endLocation: '-127.122150°,  -109.375161°',
  trackedBy: 'HQ',
  team: 'Delta',
  teamMembers: [
    { name: 'Jordan Reeves', role: 'Driver', hasLocation: true, hasTracks: true },
    { name: 'Priya Sharma', role: 'Ranger', hasLocation: true, hasTracks: true },
    { name: 'Maya Chen', role: 'Lead', hasLocation: true, hasTracks: true },
    { name: 'Amara Osei', role: 'Ranger', hasLocation: true, hasTracks: true },
  ],
  assets: [
    { name: 'KTN-123', hasLocation: true, hasTracks: true },
    { name: 'Maya Chen (Garmin)', hasLocation: true, hasTracks: true },
  ],
  objective: 'Get the team to the start of the trail',
  vehicleName: 'Vehicle',
  driverName: 'Jordan Reeves',
  armed: 'Yes',
  patrolTypeLabel: 'Vehicle Patrol',
};

const PROTOTYPE_DATES = {
  legStart: new Date('2026-04-13T08:00:00'),
  paused: new Date('2026-04-13T08:30:00'),
  legEnd: new Date('2026-04-13T08:32:00'),
};

const Breadcrumb = ({ patrolTitle, patrolId, legNumber, onClose }) => <nav className={styles.breadcrumb} aria-label="Breadcrumb">
  <ol>
    <li>
      <Link to={`/${TAB_KEYS.PATROLS}`}>Patrols</Link>
      <ChevronRightIcon width={10} height={10} />
    </li>
    <li>
      <Link to={`/${TAB_KEYS.PATROLS}/${patrolId}`}>{patrolTitle}</Link>
      <ChevronRightIcon width={10} height={10} />
    </li>
    <li className={styles.current}>Leg {legNumber}</li>
  </ol>

  <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
    <CrossIcon />
  </button>
</nav>;

const TRACK_STATES = ['off', 'on', 'pinned'];

const TrackToggleButton = () => {
  const [trackState, setTrackState] = useState('off');
  const TrackIcon = trackState === 'pinned'
    ? TracksPinnedIcon
    : trackState === 'on'
      ? TracksOnIcon
      : TracksOffIcon;

  const cycleState = () => {
    const next = TRACK_STATES[(TRACK_STATES.indexOf(trackState) + 1) % TRACK_STATES.length];
    setTrackState(next);
  };

  return <button
    type="button"
    className={`${styles.actionButton} ${styles.trackButton}`}
    aria-label={`Tracks ${trackState}`}
    aria-pressed={trackState !== 'off'}
    onClick={cycleState}
    >
    <TrackIcon />
  </button>;
};

const LegHeader = ({ leg, legNumber, isActive, onFitToView, fitActive }) => <header className={styles.header}>
  <div className={styles.headerTop}>
    <div className={styles.iconBadge}>
      <PatrolTypeIcon patrolType={leg.patrolTypeLabel} />
    </div>

    <div className={styles.titleBlock}>
      <h2 className={styles.title}>Leg {legNumber}</h2>
      <div className={styles.subtitleRow}>
        <span className={isActive ? styles.activeBadge : styles.doneBadge}>
          {isActive ? 'Active' : 'Done'}
        </span>
        <span>{leg.patrolTypeLabel}</span>
      </div>
    </div>

    <div className={styles.headerActions}>
      <TrackToggleButton />
      <button type="button" className={styles.actionButton} aria-label="Jump to location">
        <MarkerFeedIcon />
      </button>
      <button
        type="button"
        className={styles.actionButton}
        aria-label="Fit to view"
        onClick={onFitToView}
        style={fitActive ? { backgroundColor: '#0056C7', color: 'white' } : undefined}
      >
        <FitScreenOutlinedIcon />
      </button>
      <button type="button" className={styles.actionButton} aria-label="More">
        <KebabMenuIcon />
      </button>
    </div>
  </div>

  <div className={styles.statsRow}>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Events</div>
      <div className={styles.statValue}>{leg.events}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Distance</div>
      <div className={styles.statValue}>{leg.distance}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Duration</div>
      <div className={styles.statValue}>{leg.duration}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Paused Time</div>
      <div className={styles.statValue}>{leg.pausedTime}</div>
    </div>
    <div className={styles.stat}>
      <div className={styles.statLabel}>Active Time</div>
      <div className={styles.statValue}>{leg.activeTime}</div>
    </div>
  </div>
</header>;

// LegHeader takes a `leg` object with stats already baked in (events, duration,
// pausedTime, activeTime). The parent component derives those from store data.

const CoordRowField = ({ value }) => <div className={styles.coordRow}>
  <span className={styles.coordText}>{value}</span>
  <div className={styles.coordActions}>
    <button type="button" className={styles.coordButton} aria-label="Copy coordinates">
      <ContentCopyOutlinedIcon />
    </button>
    <button type="button" className={styles.coordButton} aria-label="Jump to location">
      <PlaceIcon />
    </button>
  </div>
</div>;

const EditableField = ({ onEdit, fieldKey, children }) => {
  // When onEdit is not provided the field is read-only — render as a plain
  // container with no pencil icon and no interactive semantics.
  if (!onEdit) {
    return <div className={styles.field}>{children}</div>;
  }
  const trigger = () => onEdit(fieldKey);
  return <div
    className={`${styles.field} ${styles.editableField}`}
    onClick={trigger}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter') trigger(); }}
    >
    {children}
    <button
      type="button"
      className={styles.fieldEditPencil}
      onClick={(e) => { e.stopPropagation(); trigger(); }}
      aria-label="Edit"
    >
      <EditOutlinedIcon />
    </button>
  </div>;
};

const TopSection = ({ leg, onEdit }) => <section className={styles.section}>
  <div className={styles.topGrid}>
    <EditableField onEdit={onEdit} fieldKey="start">
      <div className={styles.fieldLabel}>Start</div>
      <div className={styles.fieldValue}>{leg.startTimeText}</div>
      <CoordRowField value={leg.startLocation} />
    </EditableField>
    <EditableField onEdit={onEdit} fieldKey="end">
      <div className={styles.fieldLabel}>End</div>
      <div className={styles.fieldValue}>{leg.endTimeText}</div>
      <CoordRowField value={leg.endLocation} />
    </EditableField>

    <EditableField onEdit={onEdit} fieldKey="objective">
      <div className={styles.fieldLabel}>Objective</div>
      <div className={styles.fieldValue}>{leg.objective}</div>
    </EditableField>
    <EditableField onEdit={onEdit} fieldKey="station">
      <div className={styles.fieldLabel}>Station</div>
      <div className={styles.fieldValue}>{leg.trackedBy}</div>
    </EditableField>

    <EditableField onEdit={onEdit} fieldKey="armed">
      <div className={styles.fieldLabel}>Armed</div>
      <div className={styles.fieldValue}>{leg.armed}</div>
    </EditableField>
  </div>
</section>;

const CollectionRowActions = ({ hasLocation, hasTracks }) => {
  const [tracksOn, setTracksOn] = useState(false);
  const TracksIcon = tracksOn ? TracksOnIcon : TracksOffIcon;

  return <div className={styles.collectionRowActions}>
    {hasLocation && <button
      type="button"
      className={styles.coordButton}
      aria-label="Jump to location"
    >
      <MarkerFeedIcon />
    </button>}
    {hasTracks && <button
      type="button"
      className={styles.trackInlineButton}
      aria-label={`Tracks ${tracksOn ? 'on' : 'off'}`}
      aria-pressed={tracksOn}
      onClick={() => setTracksOn((v) => !v)}
    >
      <TracksIcon />
    </button>}
  </div>;
};

const ICON_PREFIX = 'das--activity--static--sprite-src--';

// Map an asset name to a sprite symbol id based on keywords in the name.
const assetSpriteId = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('helicopter') || n.includes('heli')) return 'helicopter-patrol-icon';
  if (n.includes('boat') || n.includes('vessel') || n.includes('marine')) return 'boat-patrol-icon';
  if (n.includes('drone') || n.includes('uav')) return 'drone-patrol-icon';
  if (n.includes('garmin') || n.includes('radio') || n.includes('sat')) return 'radio_rep';
  // Default: vehicle (covers KTN-*, trucks, jeeps, etc.)
  return 'vehicle-patrol-icon';
};

const AssetIcon = ({ name }) => <svg
  width="20"
  height="20"
  className={styles.assetIcon}
  aria-hidden="true"
>
  <use href={`#${ICON_PREFIX}${assetSpriteId(name)}`} />
</svg>;

const CollapsibleCollection = ({ label, count, items, showRole = false }) => <Collapsible
  classParentString={styles.collapsibleParent}
  contentInnerClassName={styles.collapsibleContent}
  trigger={<div className={styles.collapsibleTrigger}>
    <span>{label} - {count}</span>
    <span className={styles.collapsibleChevron}><ExpandMoreOutlinedIcon /></span>
  </div>}
  triggerWhenOpen={<div className={styles.collapsibleTrigger}>
    <span>{label} - {count}</span>
    <span className={styles.collapsibleChevron}><ExpandLessOutlinedIcon /></span>
  </div>}
  >
  {showRole && <div className={styles.collectionHeaderRow}>
    <span className={styles.collectionHeaderCell}>Name</span>
    <span className={styles.collectionHeaderCell}>Role</span>
    <span />
  </div>}
  <ul className={`${styles.collectionList} ${showRole ? styles.withRole : ''}`}>
    {items.map((item) => <li key={item.name} className={styles.collectionRow}>
      <span className={styles.collectionName}>
        {!showRole && <AssetIcon name={item.name} />}
        {item.name}
      </span>
      {showRole && <span className={styles.collectionRole}>{item.role}</span>}
      <CollectionRowActions hasLocation={item.hasLocation} hasTracks={item.hasTracks} />
    </li>)}
  </ul>
</Collapsible>;

const TeamTrackingSection = ({ leg, onEdit }) => <section className={styles.section}>
  <h3 className={styles.sectionTitle}>Team &amp; Tracking</h3>
  <div className={styles.fieldStack}>
    <EditableField onEdit={onEdit} fieldKey="team">
      <div className={styles.fieldLabel}>Team</div>
      <div className={styles.fieldValue}>{leg.team}</div>
    </EditableField>
  </div>

  <div className={styles.collapsibleStack}>
    <CollapsibleCollection
      label="Team Members"
      count={leg.teamMembers.length}
      items={leg.teamMembers}
      showRole
    />
    <CollapsibleCollection
      label="Assets"
      count={leg.assets.length}
      items={leg.assets}
    />
  </div>
</section>;

const PatrolTypeDetailsSection = ({ leg, onEdit }) => {
  const type = leg.patrolTypeLabel;
  return <section className={styles.section}>
    <h3 className={styles.sectionTitle}>Patrol Type Details</h3>
    <div className={styles.fieldGrid}>
      <EditableField onEdit={onEdit} fieldKey="patrolType">
        <div className={styles.fieldLabel}>Patrol Type</div>
        <div className={styles.fieldValue}>{type || '—'}</div>
      </EditableField>

      {type === 'Vehicle Patrol' && <>
        <EditableField onEdit={onEdit} fieldKey="fuel">
          <div className={styles.fieldLabel}>Gas in Tank</div>
          <div className={styles.fieldValue}>{leg.fuel ? `${leg.fuel} L` : '—'}</div>
        </EditableField>
      </>}

      {type === 'Foot Patrol' && <>
        <EditableField onEdit={onEdit} fieldKey="gear">
          <div className={styles.fieldLabel}>Gear</div>
          <div className={styles.fieldValue}>{leg.gear || '—'}</div>
        </EditableField>
        <EditableField onEdit={onEdit} fieldKey="rations">
          <div className={styles.fieldLabel}>Rations</div>
          <div className={styles.fieldValue}>{leg.rations?.length ? leg.rations.join(', ') : '—'}</div>
        </EditableField>
        <EditableField onEdit={onEdit} fieldKey="route">
          <div className={styles.fieldLabel}>Route</div>
          <div className={styles.fieldValue}>{leg.route || '—'}</div>
        </EditableField>
      </>}

      {type === 'Aerial Patrol' && <>
        <EditableField onEdit={onEdit} fieldKey="aircraft">
          <div className={styles.fieldLabel}>Aircraft</div>
          <div className={styles.fieldValue}>{leg.aircraft || '—'}</div>
        </EditableField>
        <EditableField onEdit={onEdit} fieldKey="fuel">
          <div className={styles.fieldLabel}>Fuel</div>
          <div className={styles.fieldValue}>{leg.fuel ? `${leg.fuel} L` : '—'}</div>
        </EditableField>
        <EditableField onEdit={onEdit} fieldKey="altitude">
          <div className={styles.fieldLabel}>Altitude</div>
          <div className={styles.fieldValue}>{leg.altitude ? `${leg.altitude} m` : '—'}</div>
        </EditableField>
      </>}

      {type === 'Routine Patrol' && <>
        <EditableField onEdit={onEdit} fieldKey="frequency">
          <div className={styles.fieldLabel}>Frequency</div>
          <div className={styles.fieldValue}>{leg.frequency || '—'}</div>
        </EditableField>
        <EditableField onEdit={onEdit} fieldKey="checkpoints">
          <div className={styles.fieldLabel}>Checkpoints</div>
          <div className={styles.fieldValue}>{leg.checkpoints || '—'}</div>
        </EditableField>
      </>}
    </div>
  </section>;
};

const PatrolLegDetailView = () => {
  const navigate = useNavigate();
  const reactNavigate = useReactNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { id: patrolId, legIndex } = useParams();
  const map = useContext(MapContext);
  const legNumber = Number(legIndex) + 1;

  const goToEdit = (focusField) => {
    const focusParam = focusField ? `?focus=${encodeURIComponent(focusField)}` : '';
    reactNavigate(`/${TAB_KEYS.PATROLS}/${patrolId}/legs/${legIndex}/edit${focusParam}`);
  };

  const patrol = useSelector((state) => state.data.patrolStore[patrolId]);
  const eventStore = useSelector((state) => state.data.eventStore);

  const [addedReportsVersion, setAddedReportsVersion] = useState(0);
  useEffect(() => subscribeAddedReports(() => setAddedReportsVersion((v) => v + 1)), []);
  const addedReportIds = useMemo(
    () => getAddedReportIds(patrolId, legIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patrolId, legIndex, addedReportsVersion]
  );

  const onAddReport = async (reportData) => {
    const { data: { data } } = Array.isArray(reportData) ? reportData[0] : reportData;
    if (!data?.id) return;
    // Persist so the report still appears after the redirect-back remount.
    addReportId(patrolId, legIndex, data.id);

    const segmentId = patrol?.patrol_segments?.[Number(legIndex)]?.id;
    if (segmentId) {
      try {
        await addPatrolSegmentToEvent(segmentId, data.id);
        await dispatch(fetchPatrol(patrolId));
      } catch (e) {

        console.warn('Failed to link event to patrol segment', e);
      }
    }
  };

  const [notesToAdd, setNotesToAdd] = useState([]);

  const onAddNote = () => {
    const hasEmpty = notesToAdd.some((n) => !n.originalText);
    if (hasEmpty) {
      window.alert('You have an empty note. Please fill it in before adding another.');
      return;
    }
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

  const onCancelNote = (note) => {
    setNotesToAdd((prev) => prev.map((n) =>
      n === note ? { ...n, text: n.originalText || '' } : n
    ));
  };

  const onDoneNote = (note) => {
    setNotesToAdd((prev) => prev.map((n) =>
      n === note ? { ...n, originalText: n.text } : n
    ));
  };

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

  const realStart = patrol ? actualStartTimeForPatrol(patrol) : null;
  const realEnd = patrol ? actualEndTimeForPatrol(patrol) : null;

  const [legsVersion, setLegsVersion] = useState(0);
  useEffect(() => subscribeLegs(() => setLegsVersion((v) => v + 1)), []);
  const legs = useMemo(() => getLegs(patrolId), [patrolId, legsVersion]);
  const leg = legs[Number(legIndex)] || PROTOTYPE_LEG;

  const [userPatrolsVersion, setUserPatrolsVersion] = useState(0);
  useEffect(() => subscribeUserPatrols(() => setUserPatrolsVersion((v) => v + 1)), []);
  const userPatrol = useMemo(
    () => getUserPatrol(patrolId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patrolId, userPatrolsVersion]
  );
  const isUserPatrol = !!userPatrol;

  // A leg is "active" when it has no end stamp — only the most-recently-started
  // leg (i.e. the current one) is open-ended.
  const isLegActive = Number(legIndex) === legs.length - 1 && !leg.endTime;
  const patrolTitle = patrol ? displayTitleForPatrol(patrol) : 'Patrol';

  // Mobile-origin patrols started from the app cannot have their active leg
  // edited from the web — fields become read-only until the leg is done.
  const canEditFields = !(userPatrol?.mobileOrigin && isLegActive);

  const onClose = () => navigate(`/${TAB_KEYS.PATROLS}`);

  // Patrol-state subscription (for pause sessions shown in the active leg).
  const [patrolStateVersion, setPatrolStateVersion] = useState(0);
  useEffect(() => subscribePatrolState(() => setPatrolStateVersion((v) => v + 1)), []);
  const { pauseSessions, endedAt: patrolEndedAt } = useMemo(
    () => getPatrolStateEntry(patrolId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patrolId, patrolStateVersion]
  );

  // Whether the leg fit button is highlighted blue.
  const [fitActive, setFitActive] = useState(false);
  const legFitListenerRef = useRef(null);

  // Fit the map to track points that fall within this leg's time window.
  // Button turns blue and clears automatically when the user pans/zooms away.
  const onFitLegToView = useCallback(() => {
    if (!map) return;
    const tracks = getPatrolTracks(patrolId);
    const startMs = leg.startedAt ? new Date(leg.startedAt).getTime() : null;
    const endMs = leg.endedAt ? new Date(leg.endedAt).getTime() : Date.now();
    if (!startMs) return;

    const legPts = Object.values(tracks).flatMap((pts) =>
      (pts || []).filter((p) => {
        if (!p.time) return false;
        const t = new Date(p.time).getTime();
        return t >= startMs && t <= endMs;
      })
    );
    if (!legPts.length) return;

    let minLng = +Infinity, minLat = +Infinity, maxLng = -Infinity, maxLat = -Infinity;
    legPts.forEach((p) => {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    });
    try {
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: { left: 756, top: 80, right: 80, bottom: 80 },
        duration: 800,
        maxZoom: 15,
      });
    } catch (_e) { /* ignore */ }

    setFitActive(true);
    if (legFitListenerRef.current) {
      try { map.off('movestart', legFitListenerRef.current); } catch (_e) { /* ignore */ }
    }
    const handler = (e) => {
      if (e.originalEvent) {
        setFitActive(false);
        try { map.off('movestart', handler); } catch (_e) { /* ignore */ }
        legFitListenerRef.current = null;
      }
    };
    legFitListenerRef.current = handler;
    map.on('movestart', handler);
  }, [map, patrolId, leg.startedAt, leg.endedAt]);

  // Clean up the movestart listener on unmount.
  useEffect(() => () => {
    if (legFitListenerRef.current && map) {
      try { map.off('movestart', legFitListenerRef.current); } catch (_e) { /* ignore */ }
    }
  }, [map]);

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
    // Only this leg's start/end markers (derived from store data).
    const boundaryItems = buildLegBoundaryItems(legs, { onlyLegIndex: Number(legIndex), jumpToDate });

    // Pause sessions are activity. Show all sessions that occurred during this
    // leg's window — its start through its end (or "now" if the leg is still
    // active).
    const legStart = leg.startedAt;
    const legEnd = leg.endedAt || new Date(8.64e15); // far future for active legs
    const pauseNodes = pauseSessions
      .filter((s) => (!legStart || s.start >= legStart) && s.start <= legEnd)
      .map((s) => ({
        sortDate: s.start,
        node: <PausedListItem
          key={s.id}
          date={s.start}
          durationLabel={s.end
            ? `${Math.max(1, Math.round((s.end - s.start) / 60000))}m`
            : null}
        />,
      }));

    // If the patrol ended within this leg's window, show the "Patrol has ended"
    // marker on the leg view too (it will be the last leg).
    const patrolEndedItems = (patrolEndedAt
      && (!legStart || patrolEndedAt >= legStart)
      && patrolEndedAt <= legEnd)
      ? [{
        sortDate: patrolEndedAt,
        node: <LegBoundaryListItem
          key="patrol-ended"
          date={patrolEndedAt}
          title="Patrol has ended"
          onJumpToLocation={() => jumpToDate(patrolEndedAt)}
        />,
      }]
      : [];

    // Demo notes and events scoped to this leg's time window.
    const inWindow = (t) => {
      const ms = new Date(t).getTime();
      return (!legStart || ms >= +legStart) && ms <= +legEnd;
    };
    const demoNotes = getDemoNotes(patrolId).filter((n) => inWindow(n.time)).map((n) => ({
      sortDate: new Date(n.time),
      node: <PrototypeDemoNoteListItem key={n.id} note={n} />,
    }));
    const demoEvents = getDemoEvents(patrolId).filter((ev) => inWindow(ev.time)).map((ev) => ({
      sortDate: new Date(ev.time),
      node: <PrototypeDemoEventListItem
        key={ev.id}
        event={ev}
        onJumpToLocation={ev.lat && ev.lng ? () => jumpToDate(ev.time) : undefined}
      />,
    }));

    return [...boundaryItems, ...pauseNodes, ...patrolEndedItems, ...demoNotes, ...demoEvents];
  }, [legs, legIndex, leg.startedAt, leg.endedAt, pauseSessions, patrolEndedAt, patrolId, isLegActive, jumpToDate]);

  const segment = patrol?.patrol_segments?.[Number(legIndex)];
  const attachments = useMemo(() => Array.isArray(patrol?.files) ? patrol.files : [], [patrol]);
  const notes = useMemo(() => Array.isArray(patrol?.notes) ? patrol.notes : [], [patrol]);

  const containedReports = useMemo(() => {
    const segmentEvents = isUserPatrol || isLegActive
      ? []
      : (Array.isArray(segment?.events) ? segment.events : []);
    const prototypeEvents = isUserPatrol || isLegActive
      ? []
      : PROTOTYPE_EVENT_IDS.map((id) => eventStore[id]).filter(Boolean);
    const addedReports = addedReportIds.map((id) => eventStore[id]).filter(Boolean);
    return [...segmentEvents, ...prototypeEvents, ...addedReports];
  }, [segment, eventStore, addedReportIds, isUserPatrol, isLegActive]);

  // Live stats scoped to this leg's window.
  const legStats = useMemo(() => {
    const now = new Date();
    const windowEnd = leg.endedAt || patrolEndedAt || (isLegActive ? now : leg.startedAt);
    return computeStatsForWindow({
      windowStart: leg.startedAt,
      windowEnd,
      pauseSessions,
      patrolIsPaused: isLegActive && pauseSessions.some((s) => !s.end),
      now,
    });
  }, [leg.startedAt, leg.endedAt, patrolEndedAt, pauseSessions, isLegActive]);

  const legWithStats = useMemo(() => ({
    ...leg,
    events: containedReports.length,
    duration: formatDuration(Math.round(legStats.durationMs / 1000)),
    pausedTime: formatDuration(Math.round(legStats.pausedMs / 1000)),
    activeTime: formatDuration(Math.round(legStats.activeMs / 1000)),
  }), [leg, containedReports.length, legStats]);

  return <div className={styles.patrolLegDetailView}>
    <TrackerContext.Provider value={tracker}>
      <Breadcrumb patrolTitle={patrolTitle} patrolId={patrolId} legNumber={legNumber} onClose={onClose} />

      <div className={styles.body}>
        <LegHeader leg={legWithStats} legNumber={legNumber} isActive={isLegActive} onFitToView={onFitLegToView} fitActive={fitActive} />
        <TopSection leg={leg} onEdit={canEditFields ? goToEdit : null} />
        <PatrolTypeDetailsSection leg={leg} onEdit={canEditFields ? goToEdit : null} />
        <TeamTrackingSection leg={leg} onEdit={canEditFields ? goToEdit : null} />

        <section className={styles.section}>
          <ActivitySection
            attachments={attachments}
            attachmentsToAdd={[]}
            containedReports={containedReports}
            defaultSortOrder={ASCENDING_SORT_ORDER}
            endTime={realEnd}
            extraItems={extraItems}
            notes={notes}
            notesToAdd={notesToAdd}
            onCancelNote={onCancelNote}
            onChangeNote={onChangeNote}
            onDeleteAttachment={() => {}}
            onDeleteNote={onDeleteNote}
            onDoneNote={onDoneNote}
            startTime={realStart}
          />

          <div className={styles.activityActions}>
            <AddNoteButton className={styles.activityActionButton} onAddNote={onAddNote} />
            <AddAttachmentButton className={styles.activityActionButton} onAddAttachments={() => {}} />
            <AddReportButton
              className={styles.activityActionButton}
              analyticsMetadata={{ category: PATROL_DETAIL_VIEW_CATEGORY, location: 'Patrol Leg Detail View' }}
              formProps={{
                isPatrolReport: true,
                onSaveSuccess: onAddReport,
                // After save (or cancel), navigate back to this patrol leg page.
                redirectTo: [
                  { pathname: location.pathname, search: location.search },
                  { state: location.state },
                ],
              }}
            />
          </div>
        </section>
      </div>

      {canEditFields && <div className={styles.stickyFooter}>
        <button type="button" className={styles.editButton} onClick={goToEdit}>
          <PencilIcon />
          <span>Edit Patrol Leg</span>
        </button>
      </div>}
    </TrackerContext.Provider>
  </div>;
};

export default memo(PatrolLegDetailView);
