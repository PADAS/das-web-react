import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen, within } from '../../../../test-utils';
import { mockStore } from '../../../../__test-helpers/MockStore';
import {
  setMapClusterData,
  setShowMapClusterPolygons,
  toggleShowInactiveRadioState,
  toggleTrackTimepointState,
} from '../../../../ducks/map-ui';

import DisplayFieldSet from './';

jest.mock('../../../../ducks/map-ui', () => ({
  ...jest.requireActual('../../../../ducks/map-ui'),
  setMapClusterData: jest.fn(),
  setShowMapClusterPolygons: jest.fn(),
  toggleShowInactiveRadioState: jest.fn(),
  toggleTrackTimepointState: jest.fn(),
}));

describe('SideBar - SettingsPane - MapTab - DisplayFieldSet', () => {
  let store;
  beforeEach(() => {
    setMapClusterData.mockImplementation(() => () => {});
    setShowMapClusterPolygons.mockImplementation(() => () => {});
    toggleShowInactiveRadioState.mockImplementation(() => () => {});
    toggleTrackTimepointState.mockImplementation(() => () => {});

    store = {
      data: {},
      view: {
        mapClusterConfig: {
          data: {
            events: true,
            subjects: true,
          },
          showPolygons: true,
        },
        showInactiveRadios: true,
        showTrackTimepoints: true,
        timeSliderState: {
          active: false,
        }
      },
    };
  });

  const renderDisplayFieldSet = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <DisplayFieldSet {...props} />
    </Provider>
  );

  test('updates the show track timepoints setting when user interacts with its checkbox', async () => {
    renderDisplayFieldSet();

    expect(toggleTrackTimepointState).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Show track timepoints' }));

    expect(toggleTrackTimepointState).toHaveBeenCalledTimes(1);
  });

  test('updates the show inactive radios setting when user interacts with its checkbox', async () => {
    renderDisplayFieldSet();

    expect(toggleShowInactiveRadioState).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Show inactive radios' }));

    expect(toggleShowInactiveRadioState).toHaveBeenCalledTimes(1);
  });

  test('updates the show cluster polygons setting when user interacts with its checkbox', async () => {
    renderDisplayFieldSet();

    expect(setShowMapClusterPolygons).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Show polygon outlining area of clustered data' }));

    expect(setShowMapClusterPolygons).toHaveBeenCalledTimes(1);
    expect(setShowMapClusterPolygons).toHaveBeenCalledWith(false);
  });

  test('shows the cluster data all checkbox as indeterminate if the cluster data is partially checked', async () => {
    store.view.mapClusterConfig.data.events = false;
    renderDisplayFieldSet();

    expect(
      within(
        screen.getByRole('group', { name: 'Cluster data when there is overlap for' })
      ).getByRole('checkbox', { name: 'All' }).indeterminate
    ).toBe(true);
  });

  test('updates the cluster data all setting when user interacts with its checkbox', async () => {
    renderDisplayFieldSet();

    expect(setMapClusterData).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Cluster data when there is overlap for' })
      ).getByRole('checkbox', { name: 'All' })
    );

    expect(setMapClusterData).toHaveBeenCalledTimes(1);
    expect(setMapClusterData).toHaveBeenCalledWith({ events: false, subjects: false });
  });

  test('updates the cluster data events setting when user interacts with its checkbox', async () => {
    renderDisplayFieldSet();

    expect(setMapClusterData).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Cluster data when there is overlap for' })
      ).getByRole('checkbox', { name: 'Events' })
    );

    expect(setMapClusterData).toHaveBeenCalledTimes(1);
    expect(setMapClusterData).toHaveBeenCalledWith({ events: false, subjects: true });
  });

  test('updates the cluster data subjects setting when user interacts with its checkbox', async () => {
    renderDisplayFieldSet();

    expect(setMapClusterData).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Cluster data when there is overlap for' })
      ).getByRole('checkbox', { name: 'Subjects' })
    );

    expect(setMapClusterData).toHaveBeenCalledTimes(1);
    expect(setMapClusterData).toHaveBeenCalledWith({ events: true, subjects: false });
  });
});
