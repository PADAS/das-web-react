import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import useSound from 'use-sound';
import NewEventNotifier, { SHOULD_PLAY_DEBOUNCE_MS } from './';

import { ENABLE_NEW_REPORT_NOTIFICATION_SOUND } from '../ducks/feature-flag-overrides';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('use-sound', () => jest.fn());


jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('NewEventNotifier', () => {
  let mockState, playFn;
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    playFn = jest.fn();

    mockState = {
      view: {
        featureFlagOverrides: {
          [ENABLE_NEW_REPORT_NOTIFICATION_SOUND]: {
            value: true,
          },
        },
      },
      data: {
        recentEventDataReceived: {
          data: {
            id: '123',
            updates: [
              {
                user: {
                  id: '121',
                  username: 'bob',
                },
                time: new Date().toISOString(),
              }
            ]
          },
        },
        feedEvents: {
          results: ['123', '222'],
        },
        user: {
          id: '456',
          username: 'sven',
        },
      },
    };

    useSound.mockImplementation(() => [playFn, { stop: jest.fn() }]);
    useSelector.mockImplementation(selectorFn => selectorFn(mockState));
  });

  it('should not play sound if the feature flag is off', () => {
    mockState.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND].value = false;
    render(<NewEventNotifier />);
    expect(playFn).not.toHaveBeenCalled();
  });

  it('should not play sound if event was recently created by current user', () => {
    mockState.data.recentEventDataReceived.data.updates[0].user.id = mockState.data.user.id;

    render(<NewEventNotifier />);
    expect(playFn).not.toHaveBeenCalled();
  });

  it(`plays a sound if all conditions are met:
  - the feature flag is on
  - has not played recently
  - recent event data has come through the web socket
  - event was not created by current user
  `, () => {
    render(<NewEventNotifier />);
    expect(playFn).toHaveBeenCalled();
  });

  it('should not play a sound if it played recently', () => {
    const { rerender } = render(<NewEventNotifier />);
    expect(playFn).toHaveBeenCalledTimes(1);

    mockState.data.recentEventDataReceived.data = {
      id: '444',
      updates: [
        {
          user: {
            id: '121',
            username: 'bob',
          },
          time: new Date().toISOString(),
        }
      ]
    };

    mockState.data.feedEvents.results = ['444', ...mockState.data.feedEvents.results];

    rerender(<NewEventNotifier />);
    expect(playFn).toHaveBeenCalledTimes(1);
  });

  it('should play a sound again if played after the debounce time has passed', () => {
    const { rerender } = render(<NewEventNotifier />);
    expect(playFn).toHaveBeenCalledTimes(1);

    /* this is the differentiating factor */
    jest.advanceTimersByTime(SHOULD_PLAY_DEBOUNCE_MS + 100);

    mockState.data.recentEventDataReceived.data = {
      id: '444',
      updates: [
        {
          user: {
            id: '121',
            username: 'bob',
          },
          time: new Date().toISOString(),
        }
      ]
    };

    mockState.data.feedEvents.results = ['444', ...mockState.data.feedEvents.results];

    rerender(<NewEventNotifier />);
    expect(playFn).toHaveBeenCalledTimes(2);
  });
});