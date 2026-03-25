import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { displayReportsOnMapState, hideSubjects } from '../../ducks/map-layer-filter';
import { INITIAL_TRACK_STATE, updateHeatmapSubjects, updateTrackState } from '../../ducks/map-ui';
import { mockStore } from '../../__test-helpers/MockStore';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { render, screen } from '../../test-utils';

import MapLayersTab from './';

jest.mock('../../ducks/map-layer-filter', () => ({
  ...jest.requireActual('../../ducks/map-layer-filter'),
  displayReportsOnMapState: jest.fn(),
  hideSubjects: jest.fn(),
}));

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  updateHeatmapSubjects: jest.fn(),
  updateTrackState: jest.fn(),
}));

describe('SideBar - MapLayersTab', () => {
  let store;
  beforeEach(() => {
    displayReportsOnMapState.mockImplementation(() => () => {});
    hideSubjects.mockImplementation(() => () => {});
    updateHeatmapSubjects.mockImplementation(() => () => {});
    updateTrackState.mockImplementation(() => () => {});

    store = {
      data: {
        featureSets: {
          data: [],
        },
        mapLayerFilter: {
          hiddenFeatureIDs: [],
          text: '',
        },
        subjectGroups: [],
        subjectStore: {},
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENTS]: [PERMISSIONS.READ],
          },
        },
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
          [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
          [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
        },
      },
    };
  });

  const renderMapLayersTab = (props) => render(
    <Provider store={mockStore(store)}>
      <MapLayersTab {...props} />
    </Provider>
  );

  test('shows all tabs and subjects is the default active key', async () => {
    renderMapLayersTab();

    const subjectsTab = screen.getByRole('tab', { name: 'Subjects' });

    expect(subjectsTab).toBeVisible();
    expect(subjectsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Features' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Analyzers' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  test('hides the subjects tab if subjects are not enabled in the system configuration', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS] = false;
    renderMapLayersTab();

    const featuresTab = screen.getByRole('tab', { name: 'Features' });

    expect(screen.queryByRole('tab', { name: 'Subjects' })).toBeNull();
    expect(featuresTab).toBeVisible();
    expect(featuresTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Analyzers' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  test('hides the features tab if features are not enabled in the system configuration', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES] = false;
    renderMapLayersTab();

    expect(screen.getByRole('tab', { name: 'Subjects' })).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Features' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Analyzers' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  test('hides the analyzers tab if analyzers are not enabled in the system configuration', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.ANALYZERS] = false;
    renderMapLayersTab();

    expect(screen.getByRole('tab', { name: 'Subjects' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Features' })).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Analyzers' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  test('hides the events tab if events are not enabled in the system configuration', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    renderMapLayersTab();

    expect(screen.getByRole('tab', { name: 'Subjects' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Features' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Analyzers' })).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Events' })).toBeNull();
  });

  test('clears all map layers when the clear all map layers button is clicked', async () => {
    renderMapLayersTab();

    expect(hideSubjects).not.toHaveBeenCalled();
    expect(displayReportsOnMapState).not.toHaveBeenCalled();
    expect(updateHeatmapSubjects).not.toHaveBeenCalled();
    expect(updateTrackState).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Clear all map layers' }));

    expect(hideSubjects).toHaveBeenCalledTimes(1);
    expect(displayReportsOnMapState).toHaveBeenCalledTimes(1);
    expect(displayReportsOnMapState).toHaveBeenCalledWith(false);
    expect(updateHeatmapSubjects).toHaveBeenCalledTimes(1);
    expect(updateHeatmapSubjects).toHaveBeenCalledWith([]);
    expect(updateTrackState).toHaveBeenCalledTimes(1);
    expect(updateTrackState).toHaveBeenCalledWith(INITIAL_TRACK_STATE);
  });
});
