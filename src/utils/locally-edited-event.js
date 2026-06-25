import pickBy from 'lodash/pickBy';

export const applyLocalEditsToEvent = (event, localEdits) => ({
  ...event,
  ...pickBy(localEdits, (value) => value !== undefined),
  locallyEdited: true,
});
