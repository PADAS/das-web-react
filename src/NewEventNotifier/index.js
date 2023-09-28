import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import useSound from 'use-sound';

import { eventWasRecentlyEditedByCurrentUser } from '../utils/events';
import { ENABLE_NEW_REPORT_NOTIFICATION_SOUND } from '../ducks/feature-flag-overrides';
import ding from '../common/sounds/ding.mp3';

export const SHOULD_PLAY_DEBOUNCE_MS = 15000; /* don't play more than every 5 seconds, for sanity */

const NewEventNotifier = () => {
  const shouldPlay = useRef(true);

  const [play] = useSound(ding);

  const notifySoundOn = useSelector(state => !!state.view.featureFlagOverrides?.[ENABLE_NEW_REPORT_NOTIFICATION_SOUND]?.value);
  const mostRecentSocketEventData = useSelector(state => state.data?.recentEventDataReceived?.data);
  const feedEventResults = useSelector(state => state.data.feedEvents.results);
  const user = useSelector(state => state.data.user);

  useEffect(() => {
    if (
      notifySoundOn
      && shouldPlay.current
      && mostRecentSocketEventData
      && !eventWasRecentlyEditedByCurrentUser(mostRecentSocketEventData, user)
      && feedEventResults
        .findIndex(id => id === mostRecentSocketEventData?.id) === 0
    ) {
      shouldPlay.current = false;
      play();

      setTimeout(() => {
        shouldPlay.current = true;
      }, SHOULD_PLAY_DEBOUNCE_MS);
    }

    /* we don't include most dependencies in the dependency array because this is
    considered a "subscription" to recently-received event data, and we don't
    want the sound to play whenever the other values change.
    */

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mostRecentSocketEventData]);


  return null;
};

export default NewEventNotifier;