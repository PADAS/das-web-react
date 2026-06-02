// Lightweight prototype store of user-created patrols so they appear
// at the top of the Patrols feed list without going through the backend.
// Persists to sessionStorage so reloads / browser-bar navigation don't wipe it.

const STORAGE_KEY = 'er-prototype-user-patrols';
const SERIAL_KEY = 'er-prototype-user-patrols-serial';

const reviveDates = (p) => ({
  ...p,
  startedAt: p.startedAt ? new Date(p.startedAt) : null,
  createdAt: p.createdAt ? new Date(p.createdAt) : null,
});

const loadFromStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(reviveDates);
  } catch (e) {
    return [];
  }
};

const saveToStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(patrols));
  } catch (e) { /* ignore quota errors */ }
};

const loadSerial = () => {
  if (typeof window === 'undefined') return 1000;
  const raw = window.sessionStorage.getItem(SERIAL_KEY);
  return raw ? Number(raw) : 1000;
};

const patrols = loadFromStorage();
const listeners = new Set();
let serialCounter = loadSerial();

const notify = () => listeners.forEach((fn) => fn());

export const getUserPatrols = () => patrols.slice();

export const getUserPatrol = (id) => patrols.find((p) => p.id === id) || null;

export const subscribeUserPatrols = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const updateUserPatrolTitle = (id, title) => {
  const idx = patrols.findIndex((p) => p.id === id);
  if (idx === -1) return;
  patrols[idx] = { ...patrols[idx], title };
  saveToStorage();
  notify();
};

// Insert a fully-formed patrol object with a caller-chosen id. Used by the
// demo-data seeder so each demo patrol has a stable id (`demo-*`) rather
// than the time-stamped one `addUserPatrol` would generate.
export const addUserPatrolRaw = (patrol) => {
  if (patrols.some((p) => p.id === patrol.id)) return null;
  const next = {
    ...patrol,
    startedAt: patrol.startedAt instanceof Date ? patrol.startedAt : new Date(patrol.startedAt),
    createdAt: patrol.createdAt instanceof Date ? patrol.createdAt : new Date(patrol.createdAt || Date.now()),
  };
  patrols.unshift(next);
  saveToStorage();
  notify();
  return next;
};

export const addUserPatrol = ({ title, patrolType, objective, startedAt }) => {
  const patrol = {
    id: `proto-${Date.now()}`,
    serial: ++serialCounter,
    title: title || 'New Patrol',
    patrolType: patrolType || 'Patrol',
    objective: objective || '',
    startedAt: startedAt || new Date(),
    createdAt: new Date(),
  };
  patrols.unshift(patrol);
  saveToStorage();
  if (typeof window !== 'undefined') {
    try { window.sessionStorage.setItem(SERIAL_KEY, String(serialCounter)); } catch (e) {}
  }
  notify();
  return patrol;
};
