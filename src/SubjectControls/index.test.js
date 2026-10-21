import userEvent from '@testing-library/user-event';

import { fetchTracksIfNecessary } from '../utils/tracks';
import { subjectIsStatic } from '../utils/subjects';

import mockSubjectData from '../__test-helpers/fixtures/subjects';

import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';
import { addModal } from '../ducks/modals';
import { render, screen } from '../test-utils';

import SubjectControls from './';

jest.mock('../utils/tracks', () => ({
  ...jest.requireActual('../utils/tracks'),
  fetchTracksIfNecessary: jest.fn(),
}));
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
    fetchTracksIfNecessary.mockReturnValue(new Promise(() => {}));
    store = mockStore({
      data: {
        tracks: {},
      },
      view: {
        subjectTrackState: { pinned: [], visible: [] },
        heatmapSubjectIDs: [],
        systemConfig: {},
      },
    });
  });

  test('rendering without crashing', () => {
    expect(() => render(
      <Provider store={store}>
        <SubjectControls subject={subject} />
      </Provider>)).not.toThrow();
  });

  describe('the histrical data button', () => {


    test('showing the historical data button', async () => {
      render(
        <Provider store={store}>
          <SubjectControls subject={subject} showHistoryButton={true} />
        </Provider>
      );

      expect(await screen.findByTestId(buttonTestId)).toBeInTheDocument();

    });

    test('showing the history modal on button click', async () => {

      render(
        <Provider store={store}>
          <SubjectControls subject={subject} showHistoryButton={true} />
        </Provider>
      );

      const button = await screen.findByTestId(buttonTestId);
      await userEvent.click(button);

      expect(addModal).toHaveBeenCalledWith(expect.objectContaining({ subjectId: subject.id, subjectIsStatic: subjectIsStatic(subject), title: `Historical Data: ${subject.name}` }));
    });
  });

  describe('the track and heatmap buttons', () => {
    const renderSubjectControls = () => render(
      <Provider store={store}>
        <SubjectControls subject={subject} />
      </Provider>
    );

    test('shows the loading state only on the track button while the subject tracks load', async () => {
      renderSubjectControls();

      await userEvent.click(screen.getByRole('button', { name: 'Tracks off' }));

      expect(screen.getByRole('button', { name: 'Tracks off' })).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('button', { name: 'Heatmap off' })).toHaveAttribute('aria-busy', 'false');
    });

    test('shows the loading state only on the heatmap button while the subject tracks load', async () => {
      renderSubjectControls();

      await userEvent.click(screen.getByRole('button', { name: 'Heatmap off' }));

      expect(screen.getByRole('button', { name: 'Heatmap off' })).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('button', { name: 'Tracks off' })).toHaveAttribute('aria-busy', 'false');
    });
  });
});
