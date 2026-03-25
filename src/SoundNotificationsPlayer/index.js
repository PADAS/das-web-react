import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import useSound from 'use-sound';

import ding from '../common/sounds/ding.mp3';

import NewEventNotificationPlayer from './NewEventNotificationPlayer';
import NewInReachMessageNotificationPlayer from './NewInReachMessageNotificationPlayer';
import RadioStateChangeToAlarmNotificationPlayer from './RadioStateChangeToAlarmNotificationPlayer';

export const SOUND_DEBOUNCE_TIME = 5000;

const SoundNotificationsPlayer = () => {
  const [play] = useSound(ding);

  const playSoundForNewEvents = useSelector((state) => state.view.userPreferences.playSoundForNewEvents);
  const playSoundForNewInReachMessages = useSelector(
    (state) => state.view.userPreferences.playSoundForNewInReachMessages
  );
  const playSoundForRadioStateChangeToRed = useSelector(
    (state) => state.view.userPreferences.playSoundForRadioStateChangeToRed
  );

  const canPlayNotificationSound = useRef(true);

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
    {playSoundForNewEvents && <NewEventNotificationPlayer
      onPlayNotificationSound={onPlayNotificationSound}
    />}

    {playSoundForNewInReachMessages && <NewInReachMessageNotificationPlayer
      onPlayNotificationSound={onPlayNotificationSound}
    />}

    {playSoundForRadioStateChangeToRed && <RadioStateChangeToAlarmNotificationPlayer
      onPlayNotificationSound={onPlayNotificationSound}
    />}
  </>;
};

export default SoundNotificationsPlayer;
