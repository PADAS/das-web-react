import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

import { mockStore } from '../../__test-helpers/MockStore';
import StateManagedSocketConsumer from '../../StateManagedSocketConsumer';

import NewInReachMessageNotificationPlayer from '.';

jest.mock('../../StateManagedSocketConsumer', () => {
  const StateManagedSocketConsumer = jest.fn();

  return {
    ...jest.requireActual('../../StateManagedSocketConsumer'),
    __esModule: true,
    default: StateManagedSocketConsumer,
  };
});

describe('SoundNotificationsPlayer - NewInReachMessageNotificationPlayer', () => {
  const onPlayNotificationSound = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: {
        subjectStore: {
          'subject1': { messaging: [] },
        },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('plays a sound when there is a new inreach message', () => {
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <NewInReachMessageNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    StateManagedSocketConsumer.mockImplementation(({ callback }) => {
      useEffect(() => {
        callback({
          data: {
            id: 'message1',
            message_type: 'inbox',
            sender: { id: 'subject1' },
          }
        });
      }, [callback]);

      return null;
    });
    store.data.subjectStore = {
      'subject1': { messaging: [{ id: 'message1' }] },
    };
    rerender(
      <Provider store={mockStore(store)}>
        <NewInReachMessageNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    expect(onPlayNotificationSound).toHaveBeenCalledTimes(1);
  });

  it('does not play a sound when there is a new inreach message if the message is not valid for display', () => {
    const { rerender } = render(
      <Provider store={mockStore(store)}>
        <NewInReachMessageNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    StateManagedSocketConsumer.mockImplementation(({ callback }) => {
      useEffect(() => {
        callback({
          data: {
            id: 'message1',
            message_type: 'inbox',
            sender: { id: 'subject1' },
          }
        });
      }, [callback]);

      return null;
    });
    rerender(
      <Provider store={mockStore(store)}>
        <NewInReachMessageNotificationPlayer onPlayNotificationSound={onPlayNotificationSound} />
      </Provider>
    );

    expect(onPlayNotificationSound).not.toHaveBeenCalled();
  });
});
