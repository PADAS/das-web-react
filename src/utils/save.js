

import { REPORT_SAVE_ACTIONS } from './events';
import { PATROL_SAVE_ACTIONS } from './patrols';

export const generateSaveActionsForReportLikeObject = (formData, type = 'report', notesToAdd = [], filesToAdd = [], communityInputValue = null) => {
  const data = { ...formData };

  let ACTIONS;

  if (type === 'report') ACTIONS = REPORT_SAVE_ACTIONS;
  if (type === 'patrol') ACTIONS = PATROL_SAVE_ACTIONS;

  if (!ACTIONS) throw new Error('Invalid save operation type');

  const primarySaveOperation = data.id ? ACTIONS.update(data, communityInputValue) : ACTIONS.create(data, communityInputValue);
  const fileOperations = [
    ...filesToAdd.map((file) => ACTIONS.addFile(file, communityInputValue)),
  ];

  const noteOperations = [
    ...notesToAdd.map((note) => ACTIONS.addNote(note, communityInputValue)),
  ];

  return [primarySaveOperation, ...fileOperations, ...noteOperations].sort((a, b) => b.priority - a.priority);
};

export const executeSaveActions = async (saveActions) => {
  let id;

  const [first, ...rest] = saveActions;

  const { action: firstAction } = first;


  try {
    const primaryResults = await firstAction();
    id = primaryResults?.data?.data?.id;

    const others = rest.map(({ action }) =>
      action(id)
    );

    return Promise.all([
      primaryResults,
      ...others,
    ]);

  } catch (error) {
    return Promise.reject(error);
  }
};
