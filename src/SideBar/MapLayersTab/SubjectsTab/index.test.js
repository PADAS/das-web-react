import React from 'react';
import { Provider } from 'react-redux';

import { render, screen } from '../../../test-utils';
import { createMapMock } from '../../../__test-helpers/mocks';
import { hideSubjects, showSubjects } from '../../../ducks/map-layer-filter';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../../constants';
import { MapContext } from '../../../App';
import { mockStore } from '../../../__test-helpers/MockStore';

import SubjectsTab from './';

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
    hideSubjects.mockImplementation(() => () => {});
    showSubjects.mockImplementation(() => () => {});

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
});
