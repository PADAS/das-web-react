import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react';

import mockSubjectData from '../__test-helpers/fixtures/subjects';

import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';

import SubjectControls from './';



describe('SubjectControls', () => {
  let store;
  const [subject] = mockSubjectData;
  const { properties } = subject;

  beforeEach(() => {
    store = mockStore({
      data: {
        tracks: {},
      },
      view: {
        subjectTrackState: { pinned: [], visible: [] },
        heatmapSubjectIDs: [],
      },
    });
  });

  test('rendering without crashing', () => {
    render(
      <Provider store={store}>
        <SubjectControls subject={properties} />
      </Provider>);
  });

  test('showing the historical data button', () => {
    render(
      <Provider store={store}>
        <SubjectControls subject={properties} showHistoryButton={true} />
      </Provider>
    );

  });
});