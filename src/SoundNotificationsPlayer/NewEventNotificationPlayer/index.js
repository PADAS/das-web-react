import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { eventWasRecentlyEditedByCurrentUser } from '../../utils/events';
import { selectActiveUser } from '../../selectors/user';

const NewEventNotificationPlayer = ({ onPlayNotificationSound }) => {
  const activeUser = useSelector(selectActiveUser);
  const feedEventResults = useSelector((state) => state.data.feedEvents.results);
  const mostRecentSocketEventData = useSelector((state) => state.data?.recentEventDataReceived?.data);

  const previousMostRecentSocketEventId = useRef(mostRecentSocketEventData?.id);

  useEffect(() => {
    const shouldNotifyAboutNewEvent = mostRecentSocketEventData
      && mostRecentSocketEventData.id !== previousMostRecentSocketEventId.current
      && !eventWasRecentlyEditedByCurrentUser(mostRecentSocketEventData, activeUser)
      && feedEventResults.findIndex((id) => id === mostRecentSocketEventData?.id) === 0;
    if (shouldNotifyAboutNewEvent) {
      onPlayNotificationSound();

      previousMostRecentSocketEventId.current = mostRecentSocketEventData.id;
    }
  }, [activeUser, feedEventResults, mostRecentSocketEventData, onPlayNotificationSound]);

  return null;
};

export default NewEventNotificationPlayer;
