import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import {
  pinSubjectTracks,
  showSubjectTracks,
  hideSubjectTracks,
  subjectTrackReducer,
  INITIAL_TRACK_STATE
} from './map-ui';

const testReducer = (state = { view: { subjectTrackState: INITIAL_TRACK_STATE } }, action) => ({
  ...state,
  view: {
    ...state.view,
    subjectTrackState: subjectTrackReducer(state.view.subjectTrackState, action)
  }
});

describe('setting the track state for multiple subjects', () => {
  let store;

  beforeEach(() => {
    store = createStore(testReducer, applyMiddleware(thunk));
  });

  test('adding subjects to the "track" state', () => {
    const subjectIds = ['subject1', 'subject2', 'subject3'];

    store.dispatch(showSubjectTracks(...subjectIds));

    const state = store.getState();
    expect(state.view.subjectTrackState).toEqual({
      visible: ['subject1', 'subject2', 'subject3'],
      pinned: []
    });
  });

  test('adding subjects to the "pinned" state', () => {
    const subjectIds = ['subject1', 'subject2', 'subject3'];

    store.dispatch(pinSubjectTracks(...subjectIds));

    const state = store.getState();
    expect(state.view.subjectTrackState).toEqual({
      visible: [],
      pinned: ['subject1', 'subject2', 'subject3']
    });
  });

  test('removing subjects from the "track" state', () => {
    store.dispatch(showSubjectTracks('subject1', 'subject2', 'subject3'));

    const subjectsToRemove = ['subject2', 'subject3'];
    store.dispatch(hideSubjectTracks(...subjectsToRemove));

    const state = store.getState();
    expect(state.view.subjectTrackState).toEqual({
      visible: ['subject1'],
      pinned: []
    });
  });

  test('removing subjects from the "pinned" state', () => {
    store.dispatch(pinSubjectTracks('subject1', 'subject2', 'subject3'));

    const subjectsToRemove = ['subject2', 'subject3'];
    store.dispatch(hideSubjectTracks(...subjectsToRemove));

    const state = store.getState();
    expect(state.view.subjectTrackState).toEqual({
      visible: [],
      pinned: ['subject1']
    });
  });
});