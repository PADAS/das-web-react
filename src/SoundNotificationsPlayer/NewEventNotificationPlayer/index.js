import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { eventWasRecentlyEditedByCurrentUser } from '../../utils/events';

const NewEventNotificationPlayer = ({ onPlayNotificationSound }) => {
  const feedEventResults = useSelector((state) => state.data.feedEvents.results);
  const mostRecentSocketEventData = useSelector((state) => state.data?.recentEventDataReceived?.data);
  const user = useSelector((state) => state.data.user);

  const previousMostRecentSocketEventId = useRef(mostRecentSocketEventData?.id);

  useEffect(() => {
    const shouldNotifyAboutNewEvent = mostRecentSocketEventData
      && mostRecentSocketEventData.id !== previousMostRecentSocketEventId.current
      && !eventWasRecentlyEditedByCurrentUser(mostRecentSocketEventData, user)
      && feedEventResults.findIndex((id) => id === mostRecentSocketEventData?.id) === 0;
    if (shouldNotifyAboutNewEvent) {
      onPlayNotificationSound();

      previousMostRecentSocketEventId.current = mostRecentSocketEventData.id;
    }
  }, [feedEventResults, mostRecentSocketEventData, onPlayNotificationSound, user]);

  return null;
};

export default NewEventNotificationPlayer;
