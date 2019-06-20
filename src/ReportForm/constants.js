import { store } from '../';

import { addFileToEvent, deleteFileFromEvent, createEvent, updateEvent, addNoteToEvent, deleteNoteFromEvent } from '../ducks/events';

const addFileToSave = addFileToEvent;

export const REPORT_SAVE_ACTIONS = {
  createEvent(data) {
    return {
      priority: 300,
      action() {
        return store.dispatch(createEvent(data));
      },
    };
  },
  updateEvent(data) {
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
  deleteNote(note_id) {
    return {
      priority: 200,
      action(event_id) {
        return store.dispatch(deleteNoteFromEvent(event_id, note_id));
      },
    };
  },
 /*  updateEventState: { // these belong inside `updateEvent` now
    priority: 100,
  }, */
  addEventToIncident(incident_id) {
    return {
      priority: 150,
      action(event_id) {
        //  POST `${apiEndpoint}/activity/event/${event_id}/relationships`
        // data:{ to_event_id: incident_id, type })
      },
    };
  },
  addFile(file) {
    return {
      priority: 200,
      action(event_id) {
        return store.dispatch(addFileToEvent(event_id, file));
      },
    };
  },
  deleteFile(file_id) {
    return {
      priority: 200,
      action(event_id) {
        return store.dispatch(deleteFileFromEvent(event_id, file_id));
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