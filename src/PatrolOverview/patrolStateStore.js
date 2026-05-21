// Persists per-patrol prototype state (Active / Paused / Done / Cancelled)
// and the pause-session history so reloads / route changes don't reset them.

const STORAGE_KEY = 'er-prototype-patrol-state';

const load = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) { return {}; }
};

const save = (data) => {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
};

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export const subscribePatrolState = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const reviveSessions = (sessions = []) => sessions.map((s) => ({
  ...s,
  start: s.start ? new Date(s.start) : null,
  end: s.end ? new Date(s.end) : null,
}));

export const getPatrolStateEntry = (patrolId) => {
  const data = load();
  const entry = data[patrolId] || {};
  return {
    state: entry.state || 'Active',
    pauseSessions: reviveSessions(entry.pauseSessions || []),
    endedAt: entry.endedAt ? new Date(entry.endedAt) : null,
  };
};

const writeEntry = (patrolId, partial) => {
  const data = load();
  const prev = data[patrolId] || {};
  data[patrolId] = { ...prev, ...partial };
  save(data);
  notify();
};

export const setPatrolStateValue = (patrolId, state) => {
  // Stamp an `endedAt` when the patrol transitions to Done (so the activity
  // feed can show a "Patrol has ended" marker). Clearing on Restore.
  const partial = { state };
  if (state === 'Done') partial.endedAt = new Date().toISOString();
  if (state === 'Active') partial.endedAt = null;
  writeEntry(patrolId, partial);
};

export const startPauseSession = (patrolId) => {
  const data = load();
  const prev = data[patrolId] || {};
  const sessions = reviveSessions(prev.pauseSessions || []);
  sessions.push({ id: `p-${Date.now()}`, start: new Date(), end: null });
  data[patrolId] = {
    ...prev,
    state: 'Paused',
    pauseSessions: sessions.map((s) => ({
      ...s,
      start: s.start?.toISOString?.() ?? s.start,
      end: s.end?.toISOString?.() ?? s.end,
    })),
  };
  save(data);
  notify();
};

export const endLastPauseSession = (patrolId) => {
  const data = load();
  const prev = data[patrolId] || {};
  const sessions = reviveSessions(prev.pauseSessions || []);
  if (sessions.length && !sessions[sessions.length - 1].end) {
    sessions[sessions.length - 1].end = new Date();
  }
  data[patrolId] = {
    ...prev,
    state: 'Active',
    pauseSessions: sessions.map((s) => ({
      ...s,
      start: s.start?.toISOString?.() ?? s.start,
      end: s.end?.toISOString?.() ?? s.end,
    })),
  };
  save(data);
  notify();
};
