import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import useSound from 'use-sound';

import { eventWasRecentlyCreatedByCurrentUser } from '../utils/events';
import { ENABLE_NEW_REPORT_NOTIFICATION_SOUND } from '../ducks/feature-flag-overrides';
import ding from '../common/sounds/ding.mp3';

export const SHOULD_PLAY_DEBOUNCE_MS = 15000; /* don't play more than every 5 seconds, for sanity */

const NewEventNotifier = () => {
  const shouldPlay = useRef(true);

  const [play] = useSound(ding);

  const notifySoundOn = useSelector(state => !!state.view.featureFlagOverrides?.[ENABLE_NEW_REPORT_NOTIFICATION_SOUND]?.value);
  const recentEventDataReceived = useSelector(state => state.data.recentEventDataReceived);
  const feedEventResults = useSelector(state => state.data.feedEvents.results);
  const user = useSelector(state => state.data.user);

  useEffect(() => {
    if (
      notifySoundOn
      && shouldPlay.current
      && recentEventDataReceived
      && !eventWasRecentlyCreatedByCurrentUser(recentEventDataReceived.data, user)
      && feedEventResults
        .findIndex(id => id === recentEventDataReceived?.data?.id) === 0
    ) {
      console.log('new event populated in the feed');
      shouldPlay.current = false;
      play();

      setTimeout(() => {
        shouldPlay.current = true;
      }, SHOULD_PLAY_DEBOUNCE_MS);
    }

    /* we don't include most dependencies here because this is
    component creates a "subscription" to recently-received event data, and we don't
    want the sound to play whenever the feed changes or shouldPlay is reset.
    */

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [play, recentEventDataReceived]);


  return null;
};

export default NewEventNotifier;