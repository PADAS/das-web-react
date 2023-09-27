import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

import NewEventNotifier, { SHOULD_PLAY_DEBOUNCE_MS } from './';

describe('NewEventNotifier', () => {
  let Wrapper, renderWithWrapper, store;

  beforeEach(() => {
    store = {
      data: {
        recentEventDataReceived: {
          data: {},
        },
        feedEvents: {
          results: [],
        },
        user: {},
      },
      view: {
        featureFlagOverrides: {},
      },
    };

    Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
      <Provider store={store}>
        {children}
      </Provider>;

    renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });
  });
  describe('playing a sound', () => {
    test('the event must be filed by another user', () => {

    });
    test('the sound feature must be toggled on', () => {

    });
    test('the event must be new in the feed', () => {

    });
  });
});