

import { REPORT_SAVE_ACTIONS } from '../ReportForm/constants';
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

export const executeSaveActions = async (saveActions) => {
  const iterateActions = async (saveActions)  => {
    let dataId;
    let responses = [];

    for (var i = 0; i < saveActions.length; i++) {
      const { action } = saveActions[i];
      const isPrimaryAction = i === 0;

      const results = await action(dataId);

      if (isPrimaryAction) {
        dataId = results.data.data.id;
      }

      responses.push(results);
    }

    return responses;
  };

  const results = await iterateActions(saveActions);

  return results;
};