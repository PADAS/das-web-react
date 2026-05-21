// Prototype: simulate per-entity track observations while a patrol is active.
// Each tracked team member / asset accumulates a list of position samples
// {lat, lng, time}. All entities share a single "leader" path that drifts a
// little each tick (so the group appears to move together) and each entity
// rides at a small fixed offset from the leader (so the lines stay close but
// distinct on the map).
//
// Persisted to sessionStorage so reloads don't lose the recorded history.

const STORAGE_KEY = 'er-prototype-patrol-tracks-v2';
const LEADER_KEY = 'er-prototype-patrol-tracks-leader-v2';

// Easter Island-area seed (matches the user-testing demo dataset).
const SEED = { lat: -27.105, lng: -109.380 };

// Distinct fixed offsets (in approximate degrees) per entity so the group
// fans out as a tight pack. Generated once per entity name from a hash so the
// same entity always lands in the same spot relative to the leader.
const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return h;
};
const offsetFor = (name) => {
  const h = hash(name);
  // Spread roughly ±0.0008 deg (~80m) so the tracks read as a group.
  const latOff = (((h >> 0) & 0xffff) / 0xffff - 0.5) * 0.0016;
  const lngOff = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 0.0016;
  return { latOff, lngOff };
};

// Distinct line colors, picked from a palette via a stable hash so the same
// entity always renders in the same color.
const PALETTE = [
  '#7DB52F', '#0056C7', '#D27A2F', '#B33A6E', '#1F8388',
  '#9C27B0', '#D89B23', '#3F35A3', '#388E3C', '#E64A19',
];
export const colorForEntity = (name) => PALETTE[Math.abs(hash(name || '')) % PALETTE.length];

const loadAll = () => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || {}; }
  catch (e) { return {}; }
};

const saveAll = (data) => {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) {}
};

const loadLeaders = () => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.sessionStorage.getItem(LEADER_KEY)) || {}; }
  catch (e) { return {}; }
};

const saveLeaders = (data) => {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.setItem(LEADER_KEY, JSON.stringify(data)); }
  catch (e) {}
};

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export const subscribePatrolTracks = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Returns `{ [entityName]: [{ lat, lng, time }] }` for the given patrol.
export const getPatrolTracks = (patrolId) => {
  const all = loadAll();
  return all[patrolId] || {};
};

export const getEntityOffset = offsetFor;

// Append one new observation per tracked entity. The "leader" position
// advances by a small heading-biased step so the group walks together; each
// entity rides at a fixed offset from the leader so the tracks stay tight.
export const tickPatrolTracks = (patrolId, trackedEntities) => {
  if (!trackedEntities?.length) return;
  const all = loadAll();
  const patrolTracks = { ...(all[patrolId] || {}) };
  const leaders = loadLeaders();
  const leader = leaders[patrolId] || { ...SEED, heading: Math.random() * 2 * Math.PI };

  // Advance leader: ~30-60m forward, with a small random heading jitter.
  const step = 0.00035 + Math.random() * 0.00025;
  const newHeading = leader.heading + (Math.random() - 0.5) * 0.5;
  const nextLeader = {
    lat: +(leader.lat + Math.sin(newHeading) * step).toFixed(6),
    lng: +(leader.lng + Math.cos(newHeading) * step).toFixed(6),
    heading: newHeading,
  };
  const now = new Date().toISOString();

  trackedEntities.forEach(({ name }) => {
    if (!name) return;
    const { latOff, lngOff } = offsetFor(name);
    const point = {
      lat: +(nextLeader.lat + latOff).toFixed(6),
      lng: +(nextLeader.lng + lngOff).toFixed(6),
      time: now,
    };
    const points = patrolTracks[name] ? [...patrolTracks[name], point] : [point];
    if (points.length > 500) points.shift();
    patrolTracks[name] = points;
  });

  all[patrolId] = patrolTracks;
  saveAll(all);
  leaders[patrolId] = nextLeader;
  saveLeaders(leaders);
  notify();
};
