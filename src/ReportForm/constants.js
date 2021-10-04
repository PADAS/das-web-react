import store from '../store';

import { createEvent, updateEvent, addNoteToEvent, uploadEventFile } from '../ducks/events';

export const REPORT_SAVE_ACTIONS = {
  create(data) {
    return {
      priority: 300,
      action() {
        return store.dispatch(createEvent(data));
      },
    };
  },
  update(data) {
    return {
      priority: 250,
      action() {
        return store.dispatch(updateEvent(data));
      },
    };
  },
  addNote(note) {
    return {
      priority: 200,
      action(event_id) {
        return store.dispatch(addNoteToEvent(event_id, note));
      },
    };
  },
  addFile(file) {
    return {
      priority: 200,
      action(event_id) {
        return store.dispatch(uploadEventFile(event_id, file));
      },
    };
  },
};

/*
  CREATE/UPDATE REPORT
  POST FILES TO REPORT
  DELETE FILES FROM REPORT
  CREATE REPORT RELATIONSHIP
*/