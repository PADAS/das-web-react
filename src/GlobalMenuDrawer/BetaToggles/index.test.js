import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { mockStore } from '../../__test-helpers/MockStore';

import { INTIAL_REDUCER_STATE, setFlagOverrideValue } from '../../ducks/feature-flag-overrides';

import BetaToggles from './';

const Wrapper = ({ children }) => <div data-testid='wrapper'>{children}</div>;

describe('the BetaToggles component', () => {
  let store;
  beforeEach(() => {
    store = mockStore({
      view: {
        featureFlagOverrides: INTIAL_REDUCER_STATE,
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

    Object.values(INTIAL_REDUCER_STATE).forEach(({ label }) => {
      expect(wrapper).toHaveTextContent(label);
    });

  });

  test('toggling overrides', async () => {
    const betaFlagToToggle = 'ENABLE_REPORT_NEW_UI';

    const toggle = await screen.findByTestId(`beta-toggle-${betaFlagToToggle}`);

    toggle.click();

    const actions = store.getActions();
    const expectedPayload = setFlagOverrideValue(betaFlagToToggle, !INTIAL_REDUCER_STATE[betaFlagToToggle].value);
    expect(actions).toEqual([expectedPayload]);
  });

});