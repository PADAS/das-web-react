import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchTracksIfNecessary } from '../../../utils/tracks';
import { render, screen, within } from '../../../test-utils';
import { createMapMock } from '../../../__test-helpers/mocks';
import { addHeatmapSubjects, showSubjectTracks } from '../../../ducks/map-ui';
import { hideSubjects, showSubjects } from '../../../ducks/map-layer-filter';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../../constants';
import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';

import SubjectsTab from './';

jest.mock('../../../utils/tracks', () => ({
  ...jest.requireActual('../../../utils/tracks'),
  fetchTracksIfNecessary: jest.fn(),
}));
jest.mock('../../../ducks/map-ui', () => ({
  ...jest.requireActual('../../../ducks/map-ui'),
  addHeatmapSubjects: jest.fn(),
  showSubjectTracks: jest.fn(),
}));
jest.mock('../../../ducks/map-layer-filter', () => {
  const actual = jest.requireActual('../../../ducks/map-layer-filter');

  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    hideSubjects: jest.fn(),
    showSubjects: jest.fn(),
  };
});

describe('SideBar - MapLayersTab - SubjectsTab', () => {
  let map, store;
  beforeEach(() => {
    fetchTracksIfNecessary.mockReturnValue(new Promise(() => {}));
    hideSubjects.mockImplementation(() => () => {});
    showSubjects.mockImplementation(() => () => {});
    addHeatmapSubjects.mockImplementation(() => () => {});
    showSubjectTracks.mockImplementation(() => () => {});

    map = createMapMock();

    store = {
      data: {
        mapLayerFilter: {
          grouped: true,
          hiddenSubjectIDs: [],
          sortBy: MAP_LAYER_SORT_VALUES.LAST_UPDATE,
          sortDirection: SORT_DIRECTION.down,
          text: '',
        },
        subjectGroups: [{
          id: 'subject-group-1',
          name: 'Subjects Group 1',
          subgroups: [{
            id: 'subject-group-2',
            name: 'Subjects Group 2',
            subgroups: [],
            subjects: ['subject-3'],
          }],
          subjects: ['subject-1', 'subject-2'],
        }, {
          id: 'subject-group-3',
          name: 'Subjects Group 3',
          subgroups: [],
          subjects: ['subject-4'],
        }],
        subjectStore: {
          'subject-1': {
            id: 'subject-1',
            name: 'Subject 1',
            last_position: {
              properties: {
                coordinateProperties: {
                  time: '2020-01-01T10:30:00.000000-08:00',
                },
              },
            },
          },
          'subject-2': {
            id: 'subject-2',
            name: 'Subject 2',
            last_position: {
              properties: {
                coordinateProperties: {
                  time: '2020-01-02T10:30:00.000000-08:00',
                },
              },
            },
          },
          'subject-3': {
            id: 'subject-3',
            name: 'Subject 3',
            last_position: {
              properties: {
                coordinateProperties: {
                  time: '2020-01-03T10:30:00.000000-08:00',
                },
              },
            },
          },
          'subject-4': {
            id: 'subject-4',
            name: 'Subject 4',
            last_position: {
              properties: {
                coordinateProperties: {
                  time: '2020-01-04T10:30:00.000000-08:00',
                },
              },
            },
          },
        },
        tracks: {},
      },
      view: {
        heatmapSubjectIDs: [],
        subjectTrackState: {
          pinned: [],
          visible: [],
        },
        systemConfig: {},
      },
    };
  });

  const renderSubjectsTab = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapContext.Provider value={map}>
        <SubjectsTab {...props} />
      </MapContext.Provider>
    </Provider>
  );

  it('shows the list of subjects', () => {
    renderSubjectsTab();

    const subjectGroupHeadings = screen.getAllByRole('heading');

    expect(subjectGroupHeadings[0]).toHaveTextContent('Subjects Group 3');
    expect(subjectGroupHeadings[1]).toHaveTextContent('Subjects Group 1');
    expect(subjectGroupHeadings[2]).toHaveTextContent('Subjects Group 2');

    const subjects = screen.getAllByRole('paragraph');

    expect(subjects[0]).toHaveTextContent('Subject 4');
    expect(subjects[1]).toHaveTextContent('Subject 3');
    expect(subjects[2]).toHaveTextContent('Subject 2');
    expect(subjects[3]).toHaveTextContent('Subject 1');
  });

  it('shows a filtered list of subjects', () => {
    store.data.mapLayerFilter.text = '1';
    renderSubjectsTab();

    expect(screen.getByText('Subjects Group 1')).toBeVisible();
    expect(screen.queryByText('Subjects Group 2')).toBeNull();
    expect(screen.queryByText('Subjects Group 3')).toBeNull();
    expect(screen.getByText('Subject 1')).toBeVisible();
    expect(screen.queryByText('Subject 2')).toBeNull();
    expect(screen.queryByText('Subject 3')).toBeNull();
    expect(screen.queryByText('Subject 4')).toBeNull();
  });

  it('shows the ungrouped list of subjects', () => {
    store.data.mapLayerFilter.grouped = false;
    renderSubjectsTab();

    expect(screen.queryByText('Subjects Group 1')).toBeNull();
    expect(screen.queryByText('Subjects Group 2')).toBeNull();
    expect(screen.queryByText('Subjects Group 3')).toBeNull();
    expect(screen.getByText('Subject 1')).toBeVisible();
    expect(screen.getByText('Subject 2')).toBeVisible();
    expect(screen.getByText('Subject 3')).toBeVisible();
    expect(screen.getByText('Subject 4')).toBeVisible();
  });

  it('shows the list of subjects sorted alphabetically', () => {
    store.data.mapLayerFilter.sortBy = MAP_LAYER_SORT_VALUES.ALPHABETICAL;
    renderSubjectsTab();

    const subjectGroupHeadings = screen.getAllByRole('heading');

    expect(subjectGroupHeadings[0]).toHaveTextContent('Subjects Group 1');
    expect(subjectGroupHeadings[1]).toHaveTextContent('Subjects Group 2');
    expect(subjectGroupHeadings[2]).toHaveTextContent('Subjects Group 3');

    const subjects = screen.getAllByRole('paragraph');

    expect(subjects[0]).toHaveTextContent('Subject 3');
    expect(subjects[1]).toHaveTextContent('Subject 1');
    expect(subjects[2]).toHaveTextContent('Subject 2');
    expect(subjects[3]).toHaveTextContent('Subject 4');
  });

  it('shows the list in up sort direction', () => {
    store.data.mapLayerFilter.sortDirection = SORT_DIRECTION.up;
    renderSubjectsTab();

    const subjectGroupHeadings = screen.getAllByRole('heading');

    expect(subjectGroupHeadings[0]).toHaveTextContent('Subjects Group 1');
    expect(subjectGroupHeadings[1]).toHaveTextContent('Subjects Group 2');
    expect(subjectGroupHeadings[2]).toHaveTextContent('Subjects Group 3');

    const subjects = screen.getAllByRole('paragraph');

    expect(subjects[0]).toHaveTextContent('Subject 3');
    expect(subjects[1]).toHaveTextContent('Subject 1');
    expect(subjects[2]).toHaveTextContent('Subject 2');
    expect(subjects[3]).toHaveTextContent('Subject 4');
  });

  describe('the track and heatmap buttons of a subject group', () => {
    const getGroupButton = (name) => within(screen.getByTestId('collapsible-Subjects Group 3'))
      .getByRole('button', { name });

    beforeEach(() => {
      store.data.subjectStore['subject-4'].tracks_available = true;
    });

    test('shows the loading state only on the track button while the group tracks load', async () => {
      renderSubjectsTab();

      await userEvent.click(getGroupButton('Tracks off'));

      expect(getGroupButton('Tracks off')).toHaveAttribute('aria-busy', 'true');
      expect(getGroupButton('Heatmap off')).not.toHaveAttribute('aria-busy');
    });

    test('shows the loading state only on the heatmap button while the group tracks load', async () => {
      renderSubjectsTab();

      await userEvent.click(getGroupButton('Heatmap off'));

      expect(getGroupButton('Heatmap off')).toHaveAttribute('aria-busy', 'true');
      expect(getGroupButton('Tracks off')).not.toHaveAttribute('aria-busy');
    });

    test.each(['Tracks off', 'Heatmap off'])(
      'clears the %s loading state once the group tracks load',
      async (buttonName) => {
        fetchTracksIfNecessary.mockResolvedValue([]);
        renderSubjectsTab();

        await userEvent.click(getGroupButton(buttonName));

        expect(getGroupButton(buttonName)).not.toHaveAttribute('aria-busy');
      },
    );

    test.each([
      ['Tracks off', showSubjectTracks],
      ['Heatmap off', addHeatmapSubjects],
    ])('clears the %s loading state and still toggles when the group fetch throws', async (buttonName, toggle) => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      fetchTracksIfNecessary.mockRejectedValue(new Error('network error'));
      renderSubjectsTab();

      await userEvent.click(getGroupButton(buttonName));

      expect(getGroupButton(buttonName)).not.toHaveAttribute('aria-busy');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Error));
      expect(toggle).toHaveBeenCalled();
    });
  });
});
