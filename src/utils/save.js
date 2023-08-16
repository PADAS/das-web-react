

import { REPORT_SAVE_ACTIONS } from './events';
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
  let id;

  const [first, ...rest] = saveActions;

  const { action: firstAction } = first;

  const primaryResults = await firstAction();

  id = primaryResults.data.data.id;

  const others = await Promise.all(
    rest.map(({ action }) =>
      action(id)
    )
  );

  return [primaryResults, ...others];
};
