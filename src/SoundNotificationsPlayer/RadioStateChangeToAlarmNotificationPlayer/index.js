import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { showToast } from '../../utils/toast';
import useJumpToLocation from '../../hooks/useJumpToLocation';

import DateTime from '../../DateTime';
import LocationJumpButton from '../../LocationJumpButton';

import styles from './styles.module.scss';

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

const RadioStateChangeToAlarmNotificationPlayer = ({ onPlayNotificationSound }) => {
  const jumpToLocation = useJumpToLocation();

  const subjectsWithAlarmRadioState = useSelector((state) => Object.values(state.data.subjectStore)
    .filter((subject) => subject?.last_position_status?.radio_state === 'alarm'));

  const previousSubjectsWithAlarmRadioState = useRef(subjectsWithAlarmRadioState?.map((subject) => subject.id));

  useEffect(() => {
    if (subjectsWithAlarmRadioState.length > 0) {
      const newSubjectsWithAlarmRadioState = subjectsWithAlarmRadioState
        .filter((subject) => !previousSubjectsWithAlarmRadioState.current.includes(subject.id));
      const shouldNotifyAboutRadioStateChangeToAlarm = newSubjectsWithAlarmRadioState.length > 0;
      if (shouldNotifyAboutRadioStateChangeToAlarm) {
        onPlayNotificationSound();

        newSubjectsWithAlarmRadioState.forEach((subject) => {
          showToast({
            message: <AlarmRadioStateToastMessage
              onClickJumpToLocation={() => jumpToLocation(subject.last_position.geometry.coordinates)}
              subject={subject}
            />,
            showDetailsByDefault: true,
            toastConfig: {
              autoClose: false,
              className: styles.toast,
              type: toast.TYPE.ERROR,
            },
          });
        });
      }
    }

    previousSubjectsWithAlarmRadioState.current = subjectsWithAlarmRadioState.map((subject) => subject.id);
  }, [
    jumpToLocation,
    onPlayNotificationSound,
    subjectsWithAlarmRadioState,
  ]);

  return null;
};

export default RadioStateChangeToAlarmNotificationPlayer;
