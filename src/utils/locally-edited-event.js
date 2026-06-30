import pickBy from 'lodash/pickBy';

// Merge a user's unsaved edits onto the stored event.
export const applyLocalEditsToEvent = (event, localEdits) => ({
  ...event,
  ...pickBy(localEdits, (value) => value !== undefined),
  locallyEdited: true,
});
