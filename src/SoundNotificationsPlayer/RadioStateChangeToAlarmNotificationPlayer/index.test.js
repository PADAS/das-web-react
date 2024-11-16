import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

import { mockStore } from '../../__test-helpers/MockStore';

import RadioStateChangeToAlarmNotificationPlayer from '.';

describe('SoundNotificationsPlayer - RadioStateChangeToAlarmNotificationPlayer', () => {
  const onPlayNotificationSound = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: {
        subjectStore: {
          'subject1': {
            id: 'subject1',
            last_position: {
              geometry: { coordinates: [25, 25] },
            },
            last_position_date: '2024-10-31T19:08:34+00:00',
            last_position_status: { radio_state: 'online-gps' },
            name: 'Ludwig',
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('plays a sound when there is a radio state change to alarm', () => {
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <RadioStateChangeToAlarmNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
        </MemoryRouter>
      </Provider>
    );

    store.data.subjectStore = {
      'subject1': {
        id: 'subject1',
        last_position: {
          geometry: { coordinates: [25, 25] },
        },
        last_position_date: '2024-10-31T19:09:34+00:00',
        last_position_status: { radio_state: 'alarm' },
        name: 'Ludwig',
      },
    };
    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <RadioStateChangeToAlarmNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
        </MemoryRouter>
      </Provider>
    );

    expect(onPlayNotificationSound).toHaveBeenCalledTimes(1);
  });

  it('does not play a sound when there is a radio update but it was already in alarm state', () => {
    store.data.subjectStore = {
      'subject1': {
        id: 'subject1',
        last_position: {
          geometry: { coordinates: [25, 25] },
        },
        last_position_date: '2024-10-31T19:09:34+00:00',
        last_position_status: { radio_state: 'alarm' },
        name: 'Ludwig',
      },
    };
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <RadioStateChangeToAlarmNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
        </MemoryRouter>
      </Provider>
    );

    store.data.subjectStore = {
      'subject1': {
        id: 'subject1',
        last_position: {
          geometry: { coordinates: [25, 25] },
        },
        last_position_date: '2024-10-31T19:10:34+00:00',
        last_position_status: { radio_state: 'alarm' },
        name: 'Ludwig',
      },
    };
    rerender(
      <Provider store={mockStore(store)}>
        <MemoryRouter>
          <RadioStateChangeToAlarmNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
        </MemoryRouter>
      </Provider>
    );

    expect(onPlayNotificationSound).not.toHaveBeenCalled();
  });
});
