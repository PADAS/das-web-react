import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '../../test-utils';

import { mockStore } from '../../__test-helpers/MockStore';

import { INITIAL_REDUCER_STATE, setFlagOverrideValue } from '../../ducks/feature-flag-overrides';

import BetaToggles from './';

const Wrapper = ({ children }) => <div data-testid='wrapper'>{children}</div>;

describe('the BetaToggles component', () => {
  let store;
  beforeEach(() => {
    store = mockStore({
      view: {
        featureFlagOverrides: INITIAL_REDUCER_STATE,
      }
    });

    render(<Provider store={store}>
      <BetaToggles />
    </Provider>, {
      wrapper: Wrapper,
    });

  });
  test('listing overrides', async () => {
    const wrapper = await screen.findByTestId('wrapper');
    const overrideLabels = ['New Patrol Form UI', 'Play Sound For New Events'];

    overrideLabels.forEach((label) => {
      expect(wrapper).toHaveTextContent(label);
    });

  });

  test('toggling overrides', async () => {
    const betaFlagToToggle = 'ENABLE_PATROL_NEW_UI';

    const toggle = await screen.findByTestId(`beta-toggle-${betaFlagToToggle}`);

    toggle.click();

    const actions = store.getActions();
    const expectedPayload = setFlagOverrideValue(betaFlagToToggle, !INITIAL_REDUCER_STATE[betaFlagToToggle].value);
    expect(actions).toEqual([expectedPayload]);
  });

});