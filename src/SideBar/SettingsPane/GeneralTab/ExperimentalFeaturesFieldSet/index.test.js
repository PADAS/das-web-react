import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'react-router';

import { render, screen } from '../../../../test-utils';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { setExperimentalFeatures } from '../../../../ducks/experimental-features';

import ExperimentalFeaturesFieldSet, { EXPERIMENTA_FEATURES_QUERY_PARAMETER } from './';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: jest.fn(),
}));

jest.mock('../../../../ducks/experimental-features', () => ({
  ...jest.requireActual('../../../../ducks/experimental-features'),
  setExperimentalFeatures: jest.fn(),
}));

jest.mock('../../../../constants', () => ({
  ...jest.requireActual('../../../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { DUMMY_FF_FOR_TESTING: true },
}));

describe('SideBar - SettingsPane - GeneralTab - ExperimentalFeaturesFieldSet', () => {
  let store;
  beforeEach(() => {
    useSearchParams.mockImplementation(() => [new URLSearchParams()]);
    setExperimentalFeatures.mockImplementation(() => () => { });

    store = {
      view: {
        experimentalFeatures: {},
      },
    };
  });

  const renderExperimentalFeaturesFieldSet = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <ExperimentalFeaturesFieldSet {...props} />
    </Provider>
  );

  test('does not show the experimental features field set if the query parameter and store are empty', async () => {
    renderExperimentalFeaturesFieldSet();

    expect(screen.queryByRole('group', { name: 'Experimental Features' })).toBeNull();
  });

  test('ignores invalid experimental features in the query parameter', async () => {
    useSearchParams.mockImplementation(() => [new URLSearchParams({
      [EXPERIMENTA_FEATURES_QUERY_PARAMETER]: 'invalid',
    })]);

    renderExperimentalFeaturesFieldSet();

    expect(screen.queryByRole('group', { name: 'Experimental Features' })).toBeNull();
  });

  test('ignores invalid experimental features in the store', async () => {
    store.view.experimentalFeatures = { invalid: false };

    renderExperimentalFeaturesFieldSet();

    expect(screen.queryByRole('group', { name: 'Experimental Features' })).toBeNull();
  });

  test('shows the experimental features field set if there are experimental features to show from the query parameter', async () => {
    useSearchParams.mockImplementation(() => [new URLSearchParams({
      [EXPERIMENTA_FEATURES_QUERY_PARAMETER]: 'DUMMY_FF_FOR_TESTING',
    })]);

    renderExperimentalFeaturesFieldSet();

    expect(screen.getByRole('group', { name: 'Experimental Features' })).toBeVisible();
    expect(screen.getByRole('checkbox', {
      name: 'sideBar.settingsPane.generalTab.experimentalFeaturesFieldSet.DUMMY_FF_FOR_TESTING',
    })).toBeChecked();
  });

  test('shows the experimental features field set if there are experimental features to show from the store', async () => {
    store.view.experimentalFeatures = { DUMMY_FF_FOR_TESTING: false };

    renderExperimentalFeaturesFieldSet();

    expect(screen.getByRole('group', { name: 'Experimental Features' })).toBeVisible();
    expect(screen.getByRole('checkbox', {
      name: 'sideBar.settingsPane.generalTab.experimentalFeaturesFieldSet.DUMMY_FF_FOR_TESTING',
    })).not.toBeChecked();
  });

  test('updates an experimental feature setting when user interacts with its checkbox', async () => {
    useSearchParams.mockImplementation(() => [new URLSearchParams({
      [EXPERIMENTA_FEATURES_QUERY_PARAMETER]: 'DUMMY_FF_FOR_TESTING',
    })]);

    renderExperimentalFeaturesFieldSet();

    expect(setExperimentalFeatures).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', {
      name: 'sideBar.settingsPane.generalTab.experimentalFeaturesFieldSet.DUMMY_FF_FOR_TESTING',
    }));

    expect(setExperimentalFeatures).toHaveBeenCalledTimes(1);
    expect(setExperimentalFeatures).toHaveBeenCalledWith({ DUMMY_FF_FOR_TESTING: false });
  });
});
