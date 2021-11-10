

import { REPORT_SAVE_ACTIONS } from '../events/forms/EventForm/constants';
import { PATROL_SAVE_ACTIONS } from './patrols';

export const generateSaveActionsForReportLikeObject = (formData, type = 'report', notesToAdd = [], filesToAdd = []) => {
  const data = { ...formData };

  let ACTIONS;

  if (type === 'report') ACTIONS = REPORT_SAVE_ACTIONS;
  if (type === 'patrol') ACTIONS = PATROL_SAVE_ACTIONS;

  if (!ACTIONS) throw new Error('Invalid save operation type');

  const primarySaveOperation = data.id ? ACTIONS.update(data) : ACTIONS.create(data);
  const fileOperations = [
    ...filesToAdd.map(ACTIONS.addFile),
  ];

  const noteOperations = [
    ...notesToAdd.map(ACTIONS.addNote),
  ];

  return [primarySaveOperation, ...fileOperations, ...noteOperations].sort((a, b) => b.priority - a.priority);
};

export const executeSaveActions = (saveActions) => {
  let dataId;
  let responses = [];

  return new Promise((resolve, reject) => {
    try {
      saveActions.reduce(async (action, { action: nextAction }, index, collection) => {
        const isPrimaryAction = index === 1;
        const isLast = index === collection.length - 1;
        const results = await action;

        if (isPrimaryAction) {
          dataId = results.data.data.id;
        }

        return nextAction(dataId)
          .then((results) => {
            responses.push(results);
            if (isLast) {
              return resolve(responses);
            }
            return results;
          })
          .catch((error) => reject(error));
      }, Promise.resolve());
    } catch (e) {
      return reject(e);
    }
  });
};