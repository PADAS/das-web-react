import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import { mockStore } from '../../__test-helpers/MockStore';

import { SET_MAP_CLUSTER_CONFIG } from '../../ducks/map-ui';
import ClusterMemberControl from './';


describe('The cluster member control', () => {
  let store;
  const initialState = {
    view: {
      timeSliderState: {
        active: false,
        virtualDate: null,
      },
      mapClusterConfig: {
        reports: true,
        subjects: true,
      },
    },
  };

  beforeEach(() => {

    store = mockStore(() => initialState);
  });

  test('being disabled if the timeslider is active', async () => {
    store = mockStore({
      view: {
        timeSliderState: {
          active: true,
          virtualDate: null,
        },
        mapClusterConfig: {
          reports: true,
          subjects: true,
        },
      },
    });

    render(<Provider store={store}>
      <ClusterMemberControl />
    </Provider>);

    const control = await screen.findByTestId('cluster-config-control');
    const subjectControl = await screen.findByTestId('cluster-config-control-subjects');
    const reportControl = await screen.findByTestId('cluster-config-control-reports');

    expect(control).toHaveAttribute('disabled');
    expect(subjectControl).toHaveAttribute('disabled');
    expect(reportControl).toHaveAttribute('disabled');
  });

  test('toggling overall membership', async () => {
    render(<Provider store={store}>
      <ClusterMemberControl />
    </Provider>);

    const control = await screen.findByTestId('cluster-config-control');

    expect(control).toBeChecked();
    fireEvent.click(control);

    const actions = store.getActions();

    expect(actions[0]).toEqual({
      type: SET_MAP_CLUSTER_CONFIG,
      payload: {
        subjects: false,
        reports: false,
      }
    });

  });

  test('toggling subject cluster membership', async () => {
    render(<Provider store={store}>
      <ClusterMemberControl />
    </Provider>);

    const control = await screen.findByTestId('cluster-config-control-subjects');

    expect(control).toBeChecked();
    fireEvent.click(control);

    const actions = store.getActions();
    expect(actions[0]).toEqual({
      type: SET_MAP_CLUSTER_CONFIG,
      payload: {
        ...initialState.view.mapClusterConfig,
        subjects: !initialState.view.mapClusterConfig.subjects,
      }
    });
  });

  test('toggling event cluster membership', async () => {
    render(<Provider store={store}>
      <ClusterMemberControl />
    </Provider>);

    const control = await screen.findByTestId('cluster-config-control-reports');

    expect(control).toBeChecked();
    fireEvent.click(control);

    const actions = store.getActions();
    expect(actions[0]).toEqual({
      type: SET_MAP_CLUSTER_CONFIG,
      payload: {
        ...initialState.view.mapClusterConfig,
        reports: !initialState.view.mapClusterConfig.reports,
      }
    });
  });
});