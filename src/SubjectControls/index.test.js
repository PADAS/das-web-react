import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { subjectIsStatic } from '../utils/subjects';

import mockSubjectData from '../__test-helpers/fixtures/subjects';

import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';

import { addModal } from '../ducks/modals';

import SubjectControls from './';

jest.mock('../ducks/modals', () => {
  const real = jest.requireActual('../ducks/modals');
  return {
    ...real,
    addModal: jest.fn(),
  };
});

describe('SubjectControls', () => {
  let store, addModalMock;
  const [subject] = mockSubjectData;
  const buttonTestId = `history-button-${subject.id}`;

  beforeEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);
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
        <SubjectControls subject={subject} />
      </Provider>);
  });

  describe('the histrical data button', () => {


    test('showing the historical data button', async () => {
      render(
        <Provider store={store}>
          <SubjectControls subject={subject} showHistoryButton={true} />
        </Provider>
      );

      await screen.findByTestId(buttonTestId);

    });

    test('showing the history modal on button click', async () => {

      render(
        <Provider store={store}>
          <SubjectControls subject={subject} showHistoryButton={true} />
        </Provider>
      );

      const button = await screen.findByTestId(buttonTestId);
      userEvent.click(button);

      expect(addModal).toHaveBeenCalledWith(expect.objectContaining({ subjectId: subject.id, subjectIsStatic: subjectIsStatic(subject), title: `Historical Data: ${subject.name}` }));
    });
  });
});