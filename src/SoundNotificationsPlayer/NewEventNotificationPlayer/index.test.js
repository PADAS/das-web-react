import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

import { mockStore } from '../../__test-helpers/MockStore';

import NewEventNotificationPlayer from '.';

describe('SoundNotificationsPlayer - NewEventNotificationPlayer', () => {
  const onPlayNotificationSound = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: {
        recentEventDataReceived: null,
        feedEvents: { results: ['event1'] },
        user: { id: 'user1' },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('plays a sound when there is a new event', () => {
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <NewEventNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    store.data.recentEventDataReceived = {
      data: {
        id: 'event2',
        updates: [
          {
            user: { id: 'user2' },
          }
        ]
      },
    };
    store.data.feedEvents = { results: ['event2', 'event1'] };
    rerender(
      <Provider store={mockStore(store)}>
        <NewEventNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    expect(onPlayNotificationSound).toHaveBeenCalledTimes(1);
  });

  it('does not play sound if the event was created recently by the current user', () => {
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <NewEventNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    store.data.recentEventDataReceived = {
      data: {
        id: 'event2',
        updates: [
          {
            time: new Date(),
            user: { id: 'user1' },
          }
        ]
      },
    };
    store.data.feedEvents = { results: ['event2', 'event1'] };
    rerender(
      <Provider store={mockStore(store)}>
        <NewEventNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    expect(onPlayNotificationSound).not.toHaveBeenCalled();
  });

  it('does not play sound if the previous event that was notified is still the same than the new', () => {
    store.data.recentEventDataReceived = {
      data: {
        id: 'event2',
        updates: [
          {
            user: { id: 'user2' },
          }
        ]
      },
    };
    store.data.feedEvents = { results: ['event2', 'event1'] };
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <NewEventNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    store.data.feedEvents = { results: ['event2', 'event1', 'event3'] };
    rerender(
      <Provider store={mockStore(store)}>
        <NewEventNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    expect(onPlayNotificationSound).not.toHaveBeenCalled();
  });
});
