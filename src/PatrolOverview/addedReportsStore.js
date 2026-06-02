// Tracks report IDs added from patrol views so they re-appear in the activity
// feed after the user is redirected back from the native event-creation form.
// Keyed by patrolId (and optionally legIndex), persisted to sessionStorage so
// the round-trip survives the remount.

const STORAGE_KEY = 'er-prototype-added-reports';

const load = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
};

const save = (data) => {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
};

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

const keyFor = (patrolId, legIndex) => (
  legIndex === undefined || legIndex === null ? `${patrolId}` : `${patrolId}|${legIndex}`
);

export const subscribeAddedReports = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getAddedReportIds = (patrolId, legIndex) => {
  const data = load();
  const ids = new Set();
  if (legIndex === undefined || legIndex === null) {
    // Patrol-level view: include patrol-scoped events + events from ALL legs.
    (data[keyFor(patrolId)] || []).forEach((id) => ids.add(id));
    const prefix = `${patrolId}|`;
    Object.keys(data).forEach((k) => {
      if (k.startsWith(prefix)) data[k].forEach((id) => ids.add(id));
    });
  } else {
    // Leg-level view: include ONLY events scoped to this specific leg.
    // Patrol-scoped events (added when no leg was active) stay on the overview.
    (data[keyFor(patrolId, legIndex)] || []).forEach((id) => ids.add(id));
  }
  return [...ids];
};

export const addReportId = (patrolId, legIndex, reportId) => {
  if (!reportId) return;
  const data = load();
  const k = keyFor(patrolId, legIndex);
  const existing = data[k] || [];
  if (existing.includes(reportId)) return;
  data[k] = [...existing, reportId];
  save(data);
  notify();
};
