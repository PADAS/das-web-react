import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import useSound from 'use-sound';

import ding from '../common/sounds/ding.mp3';
import { ENABLE_NEW_REPORT_NOTIFICATION_SOUND } from '../ducks/feature-flag-overrides';
import { eventWasRecentlyEditedByCurrentUser } from '../utils/events';

export const SHOULD_PLAY_DEBOUNCE_MS = 15000; /* don't play more than every 15 seconds, for sanity */

const NewEventNotifier = () => {
  const canPlaySound = useRef(true);

  const [play] = useSound(ding);

  const feedEventResults = useSelector(state => state.data.feedEvents.results);
  const mostRecentSocketEventData = useSelector(state => state.data?.recentEventDataReceived?.data);
  const notifySoundOn = useSelector(state => !!state.view.featureFlagOverrides?.[ENABLE_NEW_REPORT_NOTIFICATION_SOUND]?.value);
  const user = useSelector(state => state.data.user);

  useEffect(() => {
    if (
      notifySoundOn
      && canPlaySound.current
      && mostRecentSocketEventData
      && !eventWasRecentlyEditedByCurrentUser(mostRecentSocketEventData, user)
      && feedEventResults
        .findIndex(id => id === mostRecentSocketEventData?.id) === 0
    ) {
      canPlaySound.current = false;
      play();

      setTimeout(() => {
        canPlaySound.current = true;
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
