// Lightweight in-memory store for prototype patrol legs.
// Internally stores raw form-shaped leg data; derives display values on read.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const formatLegDateTime = (dateStr, timeStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const base = `${d} ${MONTHS[m - 1]} ${y}`;
  return timeStr ? `${base} ${timeStr}` : base;
};

const DEFAULT_LOCATION = '-127.122150°,  -109.375161°';

// Prototype rosters/assets stored as form-shaped so they round-trip through edits.
const LEG_1_FORM = {
  startDate: '2026-04-13', startTime: '08:00',
  endDate: '2026-04-13', endTime: '08:30',
  startLocation: null, endLocation: null,
  autoStart: true, autoEnd: true,
  trackedBy: 'KTN-123',
  station: 'Station 0',
  objective: 'Get the team to the start of the trail',
  armed: 'Yes',
  team: 'Delta',
  teamMembers: [
    { id: 'd1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
    { id: 'd2', name: 'Jordan Reeves', role: 'Driver', tracked: true },
    { id: 'd3', name: 'Leo Nakamura', role: 'Ranger' },
    { id: 'd4', name: 'Amara Osei', role: 'Ranger' },
  ],
  assets: [
    { id: 'a1', name: 'KTN-123', tracked: true },
    { id: 'a2', name: 'Maya Chen (Garmin)', tracked: true },
  ],
  patrolType: 'Vehicle Patrol',
  driverName: 'Jordan Reeves',
  vehicleName: 'KTN-123',
};

const LEG_2_FORM = {
  startDate: '2026-04-13', startTime: '08:32',
  endDate: '', endTime: '',
  startLocation: null, endLocation: null,
  autoStart: true, autoEnd: true,
  trackedBy: 'KTN-123',
  station: 'Station 0',
  objective: 'Reach overlook on foot',
  armed: 'Yes',
  team: 'Delta',
  teamMembers: [
    { id: 'd1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
    { id: 'd3', name: 'Leo Nakamura', role: 'Ranger' },
  ],
  assets: [
    { id: 'a2', name: 'Maya Chen (Garmin)', tracked: true },
  ],
  patrolType: 'Foot Patrol',
  gear: 'Hiking Pack',
  rations: ['Energy Bars', 'Water Bottles'],
  route: '',
};

const DEFAULT_STATS = {
  events: 2,
  distance: '35k',
  duration: '32min',
  pausedTime: '2min',
  activeTime: '30min',
};

// Persist to sessionStorage so a full page reload doesn't lose user edits.
// Bump the version suffix when the seed shape changes (e.g. adding `tracked`
// to roster members) so old cached entries are recomputed from the new
// defaults instead of being read back without the new fields.
const STORAGE_KEY = 'er-prototype-legs-by-patrol-v2';
const SEEDED_KEY = 'er-prototype-legs-seeded-v2';

const loadMap = () => {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw)));
  } catch (e) {
    return new Map();
  }
};

const loadSeeded = () => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(SEEDED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch (e) {
    return new Set();
  }
};

const saveMap = () => {
  if (typeof window === 'undefined') return;
  try {
    const obj = {};
    legsByPatrol.forEach((v, k) => { obj[k] = v; });
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) { /* ignore */ }
};

const saveSeeded = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SEEDED_KEY, JSON.stringify([...seeded]));
  } catch (e) { /* ignore */ }
};

const legsByPatrol = loadMap();
const listeners = new Set();

const cloneDefaults = () => [
  { ...LEG_1_FORM, _stats: { ...DEFAULT_STATS, distance: '40k', duration: '30min' } },
  { ...LEG_2_FORM, _stats: { ...DEFAULT_STATS } },
];

// Track which patrols have been explicitly seeded by the user so we don't
// fall back to the prototype defaults for them.
const seeded = loadSeeded();

const ensure = (patrolId) => {
  if (!legsByPatrol.has(patrolId)) {
    legsByPatrol.set(patrolId, seeded.has(patrolId) ? [] : cloneDefaults());
    saveMap();
  }
  return legsByPatrol.get(patrolId);
};

// Seed a patrol with an explicit set of legs (skips the prototype defaults).
// Stats default to zeros so newly created patrols start at "0 events" etc.
const ZERO_STATS = {
  events: 0, distance: '0 km', duration: '0min', pausedTime: '0min', activeTime: '0min',
};

// Seed a patrol's legs verbatim, computing `_createdAt` / `_endedAt` from the
// configured startDate/startTime + endDate/endTime so activity timestamps
// match the demo data instead of `Date.now()`. Used by the demo seeder.
export const seedLegs = (patrolId, legs) => {
  seeded.add(patrolId);
  const out = legs.map((l) => {
    const startedAtMs = l.startDate
      ? new Date(`${l.startDate}T${l.startTime || '00:00'}:00`).getTime()
      : Date.now();
    const endedAtMs = l.endDate
      ? new Date(`${l.endDate}T${l.endTime || '00:00'}:00`).getTime()
      : null;
    return {
      ...l,
      _createdAt: l._createdAt ?? startedAtMs,
      _endedAt: l._endedAt ?? endedAtMs,
      _stats: l._stats || { ...ZERO_STATS },
    };
  });
  legsByPatrol.set(patrolId, out);
  saveMap();
  saveSeeded();
  notify();
};

export const initLegs = (patrolId, legs) => {
  seeded.add(patrolId);
  const now = Date.now();
  legsByPatrol.set(patrolId, legs.map((l, i) => ({
    ...l,
    _createdAt: l._createdAt ?? (now + i), // monotonic stamps for ordering
    _stats: l._stats || { ...ZERO_STATS },
  })));
  saveMap();
  saveSeeded();
  notify();
};

const notify = () => listeners.forEach((fn) => fn());

export const subscribeLegs = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const teamSummaryFor = (members = []) => {
  const lead = members[0]?.name;
  if (!lead) return '';
  const extras = members.length - 1;
  return extras > 0 ? `${lead} +${extras}` : lead;
};

const toDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0);
};

// Convert a raw form-shaped leg into the display object the views consume.
export const toDisplayLeg = (form, index) => ({
  // Events added via the prototype "Event" button (revived from sessionStorage).
  // (Stored under `legEvents` to avoid colliding with the `events` stat below.)
  legEvents: (form._events || []).map((e) => ({ ...e, time: new Date(e.time) })),

  // Real Date objects for activity-feed sorting. Use the precise ms-resolution
  // stamps when available (set by addLeg / initLegs); fall back to deriving
  // from the user-facing date+time strings.
  startedAt: form._createdAt ? new Date(form._createdAt) : toDate(form.startDate, form.startTime),
  endedAt: form._endedAt ? new Date(form._endedAt) : (form.endDate ? toDate(form.endDate, form.endTime) : null),

  // Table fields
  index,
  legNumber: index + 1,
  typeLabel: form.patrolType || 'Patrol',
  startTime: formatLegDateTime(form.startDate, form.startTime),
  endTime: form.endDate ? formatLegDateTime(form.endDate, form.endTime) : '',
  teamSummary: teamSummaryFor(form.teamMembers),

  // Detail-view fields
  patrolTypeLabel: form.patrolType || 'Patrol',
  startTimeText: formatLegDateTime(form.startDate, form.startTime),
  endTimeText: form.endDate ? formatLegDateTime(form.endDate, form.endTime) : '—',
  startLocation: form.startLocation
    ? `${form.startLocation.longitude?.toFixed?.(6) ?? form.startLocation.longitude}°,  ${form.startLocation.latitude?.toFixed?.(6) ?? form.startLocation.latitude}°`
    : DEFAULT_LOCATION,
  endLocation: form.endLocation
    ? `${form.endLocation.longitude?.toFixed?.(6) ?? form.endLocation.longitude}°,  ${form.endLocation.latitude?.toFixed?.(6) ?? form.endLocation.latitude}°`
    : DEFAULT_LOCATION,
  trackedBy: form.station || form.trackedBy || '',
  team: form.team || '',
  // Tracking actions (location pin / tracks toggle) only render for entities
  // marked `tracked` — e.g. team members carrying phones, or asset trackers.
  teamMembers: (form.teamMembers || []).map((m) => ({
    ...m, hasLocation: !!m.tracked, hasTracks: !!m.tracked,
  })),
  // Assets are always tracking devices (radios, Garmins, vehicles), so they
  // default to tracked unless explicitly opted out.
  assets: (form.assets || []).map((a) => ({
    ...a, hasLocation: a.tracked !== false, hasTracks: a.tracked !== false,
  })),
  objective: form.objective || '',
  armed: form.armed || '',
  driverName: form.driverName || '',
  vehicleName: form.vehicleName || '',
  gear: form.gear || '',
  rations: form.rations || [],
  route: form.route || '',
  fuel: form.fuel || '',
  aircraft: form.aircraft || '',
  pilotName: form.pilotName || '',
  altitude: form.altitude || '',
  frequency: form.frequency || '',
  checkpoints: form.checkpoints || '',

  // Stats (prototype)
  ...(form._stats || DEFAULT_STATS),

  // Raw form for editing
  _form: form,
});

export const getLegs = (patrolId) => ensure(patrolId).map(toDisplayLeg);

export const getLegForm = (patrolId, legIndex) => {
  const idx = Number(legIndex);
  const list = ensure(patrolId);
  return list[idx] ? { ...list[idx] } : null;
};

export const addLeg = (patrolId, formData) => {
  const current = ensure(patrolId);
  const transitionAt = Date.now(); // ms-precision transition stamp for activity sort
  // Set previous leg's end to new leg's start so only the most recent leg is open.
  const updated = current.map((l, idx) => (
    idx === current.length - 1
      ? { ...l, endDate: formData.startDate, endTime: formData.startTime, _endedAt: transitionAt }
      : l
  ));
  const newLeg = {
    ...formData,
    endDate: '',
    endTime: '',
    _createdAt: transitionAt,
    _stats: { ...DEFAULT_STATS, events: 0, distance: '0k', duration: '0min', pausedTime: '0min', activeTime: '0min' },
  };
  legsByPatrol.set(patrolId, [...updated, newLeg]);
  saveMap();
  notify();
};

export const updateLeg = (patrolId, legIndex, formData) => {
  const idx = Number(legIndex);
  const current = ensure(patrolId);
  if (!current[idx]) return;
  const next = current.map((l, i) => (
    i === idx ? { ...l, ...formData } : l
  ));
  legsByPatrol.set(patrolId, next);
  saveMap();
  notify();
};

// Stamp the active (last) leg as ended at "now". Called when the user presses
// End on the overview, so the patrol's final leg gets a proper end stamp and
// the activity feed can show a "Leg N <Patrol Type> Ended" marker.
export const stampLastLegEnded = (patrolId) => {
  const current = ensure(patrolId);
  if (!current.length) return;
  const last = current[current.length - 1];
  if (last.endDate) return; // already ended
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const endTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const next = current.map((l, i) => (
    i === current.length - 1
      ? { ...l, endDate, endTime, _endedAt: now.getTime() }
      : l
  ));
  legsByPatrol.set(patrolId, next);
  saveMap();
  notify();
};

// Append a prototype event to a leg's activity feed.
export const addEventToLeg = (patrolId, legIndex, event) => {
  const idx = Number(legIndex);
  const current = ensure(patrolId);
  if (!current[idx]) return;
  const leg = current[idx];
  const events = Array.isArray(leg._events) ? leg._events : [];
  const next = current.map((l, i) => (
    i === idx
      ? { ...l, _events: [...events, { ...event, time: new Date(event.time || Date.now()).toISOString() }] }
      : l
  ));
  legsByPatrol.set(patrolId, next);
  saveMap();
  notify();
};
