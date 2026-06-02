// In-memory store that tracks which patrol entities have their map tracks
// shown or hidden. The default for any entity not explicitly set is visible.
//
// API:
//   isEntityVisible(patrolId, name) → bool
//   setEntityVisible(patrolId, name, visible)
//   setAllEntitiesVisible(patrolId, names, visible)
//   subscribeVisibility(fn) → unsubscribeFn

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

// { [patrolId]: { [entityName]: boolean } }
// Absence or `true` = visible; explicit `false` = hidden.
const state = {};

export const isEntityVisible = (patrolId, name) =>
  state[patrolId]?.[name] !== false;

export const setEntityVisible = (patrolId, name, visible) => {
  state[patrolId] = { ...(state[patrolId] || {}), [name]: visible };
  notify();
};

export const setAllEntitiesVisible = (patrolId, names, visible) => {
  const patch = {};
  names.forEach((n) => { patch[n] = visible; });
  state[patrolId] = { ...(state[patrolId] || {}), ...patch };
  notify();
};

export const subscribeVisibility = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
