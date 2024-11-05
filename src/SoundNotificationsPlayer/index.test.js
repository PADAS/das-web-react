import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import useSound from 'use-sound';

import {
  ENABLE_NEW_REPORT_NOTIFICATION_SOUND,
  ENABLE_NEW_IN_REACH_MESSAGE_NOTIFICATION_SOUND,
  ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND,
} from '../ducks/feature-flag-overrides';
import { mockStore } from '../__test-helpers/MockStore';

import NewEventNotificationPlayer from './NewEventNotificationPlayer';
import NewInReachMessageNotificationPlayer from './NewInReachMessageNotificationPlayer';
import RadioStateChangeToAlarmNotificationPlayer from './RadioStateChangeToAlarmNotificationPlayer';
import SoundNotificationsPlayer, { SOUND_DEBOUNCE_TIME } from './';

jest.mock('use-sound', () => jest.fn());

jest.mock('./NewEventNotificationPlayer', () => jest.fn());

jest.mock('./NewInReachMessageNotificationPlayer', () => jest.fn());

jest.mock('./RadioStateChangeToAlarmNotificationPlayer', () => jest.fn());

describe('SoundNotificationsPlayer', () => {
  let play, store;
  beforeEach(() => {
    play = jest.fn();
    useSound.mockImplementation(() => [play, { stop: jest.fn() }]);
    NewEventNotificationPlayer.mockImplementation(({ onPlayNotificationSound }) => {
      useEffect(() => {
        onPlayNotificationSound();
      }, [onPlayNotificationSound]);

      return null;
    });
    NewInReachMessageNotificationPlayer.mockImplementation(({ onPlayNotificationSound }) => {
      useEffect(() => {
        onPlayNotificationSound();
      }, [onPlayNotificationSound]);

      return null;
    });
    RadioStateChangeToAlarmNotificationPlayer.mockImplementation(({ onPlayNotificationSound }) => {
      useEffect(() => {
        onPlayNotificationSound();
      }, [onPlayNotificationSound]);

      return null;
    });

    store = {
      view: {
        featureFlagOverrides: {
          [ENABLE_NEW_REPORT_NOTIFICATION_SOUND]: {
            value: false,
          },
          [ENABLE_NEW_IN_REACH_MESSAGE_NOTIFICATION_SOUND]: {
            value: false,
          },
          [ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND]: {
            value: false,
          },
        },
      },
    };
  });

  const renderSoundNotificationsPlayer = (overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <SoundNotificationsPlayer />
    </Provider>
  );

  it('does not play a sound if the user did not check the settings', () => {
    renderSoundNotificationsPlayer();

    expect(play).not.toHaveBeenCalled();
  });

  it('plays a sound when there is a new event if the user checked the setting', () => {
    store.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND] = { value: true };
    renderSoundNotificationsPlayer();

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('plays a sound when there is a new inreach message if the user checked the setting', () => {
    store.view.featureFlagOverrides[ENABLE_NEW_IN_REACH_MESSAGE_NOTIFICATION_SOUND] = { value: true };
    renderSoundNotificationsPlayer();

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('plays a sound when there is a radio state change to alarm if the user checked the setting', () => {
    store.view.featureFlagOverrides[ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND] = { value: true };
    renderSoundNotificationsPlayer();

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('does not play a notification sound immediately after another', () => {
    jest.useFakeTimers();

    store.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND] = { value: true };
    NewEventNotificationPlayer.mockImplementation(({ onPlayNotificationSound }) => {
      useEffect(() => {
        onPlayNotificationSound();
        setTimeout(() => onPlayNotificationSound(), 1000);
      }, [onPlayNotificationSound]);

      return null;
    });
    renderSoundNotificationsPlayer();

    expect(play).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);

    expect(play).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('plays a notification sound after another if the debounce time passed', () => {
    jest.useFakeTimers();

    store.view.featureFlagOverrides[ENABLE_NEW_REPORT_NOTIFICATION_SOUND] = { value: true };
    NewEventNotificationPlayer.mockImplementation(({ onPlayNotificationSound }) => {
      useEffect(() => {
        onPlayNotificationSound();
        setTimeout(() => onPlayNotificationSound(), SOUND_DEBOUNCE_TIME);
      }, [onPlayNotificationSound]);

      return null;
    });
    renderSoundNotificationsPlayer();

    expect(play).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(SOUND_DEBOUNCE_TIME);

    expect(play).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
