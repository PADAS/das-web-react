import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import useSound from 'use-sound';

import {
  ENABLE_NEW_REPORT_NOTIFICATION_SOUND,
  ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND,
} from '../ducks/feature-flag-overrides';
import { mockStore } from '../__test-helpers/MockStore';

import SoundNotificationsPlayer, { SHOULD_PLAY_DEBOUNCE_MS } from './';

jest.mock('use-sound', () => jest.fn());

describe('SoundNotificationsPlayer', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  let playFn, store;
  beforeEach(() => {
    playFn = jest.fn();

    store = {
      view: {
        featureFlagOverrides: {
          [ENABLE_NEW_REPORT_NOTIFICATION_SOUND]: {
            value: false,
          },
          [ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND]: {
            value: false,
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
        subjectStore: {
          'sub123': {
            id: 'sub123',
            last_position: {
              geometry: {
                coordinates: [25, 25],
              },
            },
            last_position_date: '2024-10-31T19:08:34+00:00',
            last_position_status: {
              radio_state: 'alarm'
            },
            name: 'Ludwig',
          },
        },
        user: {
          id: '456',
          username: 'sven',
        },
      },
    };

    useSound.mockImplementation(() => [playFn, { stop: jest.fn() }]);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const renderSoundNotificationsPlayer = (overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MemoryRouter>
        <SoundNotificationsPlayer />
      </MemoryRouter>
    </Provider>
  );

  it('should not play sound when there is a new event if the feature flag is off', () => {
    renderSoundNotificationsPlayer(store);

    expect(playFn).not.toHaveBeenCalled();
  });

  it('should not play sound if the event was created by the current user', () => {
    store.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND].value = true;
    store.data.recentEventDataReceived.data.updates[0].user.id = store.data.user.id;
    renderSoundNotificationsPlayer(store);

    expect(playFn).not.toHaveBeenCalled();
  });

  it(`plays a sound when there is a new event if all conditions are met:
  - the feature flag is on
  - has not played recently
  - recent event data has come through the web socket
  - event was not created by current user
  `, () => {
    store.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND].value = true;
    renderSoundNotificationsPlayer();

    expect(playFn).toHaveBeenCalled();
  });

  it('should not play a sound when there is a new event if it played recently', () => {
    store.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND].value = true;
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);

    store.data.recentEventDataReceived.data = {
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
    store.data.feedEvents.results = ['444', ...store.data.feedEvents.results];

    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);
  });

  it('should play a sound again when there is a new event if the debounce time has passed', () => {
    store.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND].value = true;
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(SHOULD_PLAY_DEBOUNCE_MS + 100);

    store.data.recentEventDataReceived.data = {
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
    store.data.feedEvents.results = ['444', ...store.data.feedEvents.results];

    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(2);
  });

  it('should not play sound when there is a radio in alarm state if the feature flag is off', () => {
    renderSoundNotificationsPlayer(store);

    expect(playFn).not.toHaveBeenCalled();
  });

  it(`plays a sound when there is a radio in alarm state if all conditions are met:
    - the feature flag is on
    - has not played recently
    - the radio state was just changed
    `, () => {
    store.view.featureFlagOverrides[ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND].value = true;
    renderSoundNotificationsPlayer();

    expect(playFn).toHaveBeenCalled();
  });

  it('should not play a sound when there is a radio in alarm state if it played recently', () => {
    store.view.featureFlagOverrides[ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND].value = true;
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);

    store.data.subjectStore = {
      'sub123': {
        id: 'sub123',
        last_position: {
          geometry: {
            coordinates: [25, 25],
          },
        },
        last_position_date: '2024-10-31T19:09:34+00:00',
        last_position_status: {
          radio_state: 'online-gps'
        },
        name: 'Ludwig',
      },
    };

    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    store.data.subjectStore = {
      'sub123': {
        id: 'sub123',
        last_position: {
          geometry: {
            coordinates: [25, 25],
          },
        },
        last_position_date: '2024-10-31T19:10:34+00:00',
        last_position_status: {
          radio_state: 'alarm'
        },
        name: 'Ludwig',
      },
    };

    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);
  });

  it('should play a sound again when there is a radio in alarm state if the debounce time has passed', () => {
    store.view.featureFlagOverrides[ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND].value = true;
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);

    store.data.subjectStore = {
      'sub123': {
        id: 'sub123',
        last_position: {
          geometry: {
            coordinates: [25, 25],
          },
        },
        last_position_date: '2024-10-31T19:09:34+00:00',
        last_position_status: {
          radio_state: 'online-gps'
        },
        name: 'Ludwig',
      },
    };

    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    jest.advanceTimersByTime(SHOULD_PLAY_DEBOUNCE_MS + 100);

    store.data.subjectStore = {
      'sub123': {
        id: 'sub123',
        last_position: {
          geometry: {
            coordinates: [25, 25],
          },
        },
        last_position_date: '2024-10-31T19:10:34+00:00',
        last_position_status: {
          radio_state: 'alarm'
        },
        name: 'Ludwig',
      },
    };

    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(2);
  });

  it('should not play a sound again when there is a radio in alarm state that was already in that state', () => {
    store.view.featureFlagOverrides[ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND].value = true;
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(SHOULD_PLAY_DEBOUNCE_MS + 100);

    store.data.subjectStore = {
      'sub123': {
        id: 'sub123',
        last_position: {
          geometry: {
            coordinates: [25, 25],
          },
        },
        last_position_date: '2024-10-31T19:10:34+00:00',
        last_position_status: {
          radio_state: 'alarm'
        },
        name: 'Ludwig',
      },
    };

    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <SoundNotificationsPlayer />
        </MemoryRouter>
      </Provider>
    );

    expect(playFn).toHaveBeenCalledTimes(1);
  });
});
