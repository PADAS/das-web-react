import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import useSound from 'use-sound';
import { useTranslation } from 'react-i18next';

import ding from '../common/sounds/ding.mp3';
import {
  ENABLE_NEW_REPORT_NOTIFICATION_SOUND,
  ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND,
} from '../ducks/feature-flag-overrides';
import { eventWasRecentlyEditedByCurrentUser } from '../utils/events';
import { showToast } from '../utils/toast';
import useJumpToLocation from '../hooks/useJumpToLocation';

import DateTime from '../DateTime';
import LocationJumpButton from '../LocationJumpButton';

import styles from './styles.module.scss';

export const SHOULD_PLAY_DEBOUNCE_MS = 15000; /* don't play more than every 15 seconds, for sanity */

const AlarmRadioStateToastMessage = ({ onClickJumpToLocation, subject }) => {
  const { t } = useTranslation('components', { keyPrefix: 'soundNotificationsPlayer' });

  return <div className={styles.alarmRadioStateToast}>
    <div>
      {t('alarmRadioStateToastMessage', { subjectName: subject.name })}

      {subject.last_position_date && <DateTime
        className={styles.subjectLastPositionDate}
        date={subject.last_position_date}
        showElapsed={false}
      />}
    </div>

    {subject.last_position?.geometry?.coordinates && <LocationJumpButton
      bypassLocationValidation
      className={styles.subjectLocationJumpButton}
      onClick={onClickJumpToLocation}
    />}
  </div>;
};

const SoundNotificationsPlayer = () => {
  const jumpToLocation = useJumpToLocation();

  const canPlayNewEventNotificationSound = useRef(true);
  const canPlayRadioStateChangeToAlarmNotificationSound = useRef(true);
  const previousSubjectsWithAlarmRadioState = useRef([]);

  const [play] = useSound(ding);

  const feedEventResults = useSelector((state) => state.data.feedEvents.results);
  const isNewEventNotificationSoundEnabled = useSelector((state) => !!state.view.featureFlagOverrides?.[ENABLE_NEW_REPORT_NOTIFICATION_SOUND]?.value);
  const isRadioStateChangeToAlarmNotificationSoundEnabled = useSelector((state) => !!state.view.featureFlagOverrides?.[ENABLE_RADIO_STATE_CHANGE_TO_ALARM_NOTIFICATION_SOUND]?.value);
  const mostRecentSocketEventData = useSelector((state) => state.data?.recentEventDataReceived?.data);
  const subjectsWithAlarmRadioState = useSelector((state) => Object.values(state.data.subjectStore)
    .filter((subject) => subject?.last_position_status?.radio_state === 'alarm'));
  const user = useSelector((state) => state.data.user);

  useEffect(() => {
    const shouldNotifyAboutNewEvent = isNewEventNotificationSoundEnabled
      && mostRecentSocketEventData
      && !eventWasRecentlyEditedByCurrentUser(mostRecentSocketEventData, user)
      && feedEventResults.findIndex(id => id === mostRecentSocketEventData?.id) === 0;
    if (canPlayNewEventNotificationSound.current && shouldNotifyAboutNewEvent) {
      canPlayNewEventNotificationSound.current = false;
      play();

      setTimeout(() => {
        canPlayNewEventNotificationSound.current = true;
      }, SHOULD_PLAY_DEBOUNCE_MS);
    }

    /* we don't include most dependencies in the dependency array because this is
    considered a "subscription" to recently-received event data, and we don't
    want the sound to play whenever the other values change.
    */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mostRecentSocketEventData]);

  useEffect(() => {
    if (subjectsWithAlarmRadioState.length > 0) {
      const newSubjectsWithAlarmRadioState = subjectsWithAlarmRadioState
        .filter((subject) => !previousSubjectsWithAlarmRadioState.current.includes(subject.id));
      const shouldNotifyAboutRadioStateChangeToAlarm = isRadioStateChangeToAlarmNotificationSoundEnabled
        && newSubjectsWithAlarmRadioState.length > 0;
      if (canPlayRadioStateChangeToAlarmNotificationSound.current && shouldNotifyAboutRadioStateChangeToAlarm) {
        canPlayRadioStateChangeToAlarmNotificationSound.current = false;
        play();
        newSubjectsWithAlarmRadioState.forEach((subject) => {
          showToast({
            message: <AlarmRadioStateToastMessage
              onClickJumpToLocation={() => jumpToLocation(subject.last_position.geometry.coordinates)}
              subject={subject}
            />,
            showDetailsByDefault: true,
            toastConfig: { autoClose: false, type: toast.TYPE.ERROR },
          });
        });

        setTimeout(() => {
          canPlayRadioStateChangeToAlarmNotificationSound.current = true;
        }, SHOULD_PLAY_DEBOUNCE_MS);
      }
    }

    previousSubjectsWithAlarmRadioState.current = subjectsWithAlarmRadioState.map((subject) => subject.id);
  }, [
    isRadioStateChangeToAlarmNotificationSoundEnabled,
    jumpToLocation,
    play,
    subjectsWithAlarmRadioState,
  ]);

  return null;
};

export default SoundNotificationsPlayer;
