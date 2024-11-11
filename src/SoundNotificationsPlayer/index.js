import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import useSound from 'use-sound';

import ding from '../common/sounds/ding.mp3';
import {
  ENABLE_NEW_REPORT_NOTIFICATION_SOUND,
  ENABLE_NEW_IN_REACH_MESSAGE_NOTIFICATION_SOUND,
  ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND,
} from '../ducks/feature-flag-overrides';

import NewEventNotificationPlayer from './NewEventNotificationPlayer';
import NewInReachMessageNotificationPlayer from './NewInReachMessageNotificationPlayer';
import RadioStateChangeToAlarmNotificationPlayer from './RadioStateChangeToAlarmNotificationPlayer';

export const SOUND_DEBOUNCE_TIME = 5000;

const SoundNotificationsPlayer = () => {
  const [play] = useSound(ding);

  const canPlayNotificationSound = useRef(true);

  const isNewEventNotificationSoundEnabled = useSelector(
    (state) => !!state.view.featureFlagOverrides?.[ENABLE_NEW_REPORT_NOTIFICATION_SOUND]?.value
  );
  const isNewInReachMessageNotificationSoundEnabled = useSelector(
    (state) => !!state.view.featureFlagOverrides?.[ENABLE_NEW_IN_REACH_MESSAGE_NOTIFICATION_SOUND]?.value
  );
  const isRadioStateChangeToAlarmNotificationSoundEnabled = useSelector(
    (state) => !!state.view.featureFlagOverrides?.[ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND]?.value
  );

  const onPlayNotificationSound = useCallback(() => {
    if (canPlayNotificationSound.current) {
      play();

      canPlayNotificationSound.current = false;
      setTimeout(() => {
        canPlayNotificationSound.current = true;
      }, SOUND_DEBOUNCE_TIME);
    }
  }, [play]);

  return <>
    {isNewEventNotificationSoundEnabled && <NewEventNotificationPlayer
      onPlayNotificationSound={onPlayNotificationSound}
    />}

    {isNewInReachMessageNotificationSoundEnabled && <NewInReachMessageNotificationPlayer
      onPlayNotificationSound={onPlayNotificationSound}
    />}

    {isRadioStateChangeToAlarmNotificationSoundEnabled && <RadioStateChangeToAlarmNotificationPlayer
      onPlayNotificationSound={onPlayNotificationSound}
    />}
  </>;
};

export default SoundNotificationsPlayer;
