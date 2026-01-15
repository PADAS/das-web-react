import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { showToast } from '../../utils/toast';
import useJumpToLocation from '../../hooks/useJumpToLocation';

import DateTime from '../../DateTime';
import LocationJumpButton from '../../LocationJumpButton';

import * as styles from './styles.module.scss';
import { calcDisplayNameForSubject } from '../../utils/subjects';

const AlarmRadioStateToastMessage = ({ onClickJumpToLocation, subject }) => {
  const { t } = useTranslation('components', { keyPrefix: 'soundNotificationsPlayer' });

  return <div className={styles.alarmRadioStateToast}>
    <div>
      {t('alarmRadioStateToastMessage', { subjectName: calcDisplayNameForSubject(subject.name) })}

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

  const subjectStore = useSelector((state) => state.data.subjectStore);

  const subjectsWithAlarmRadioState = useMemo(
    () => Object.values(subjectStore).filter((subject) => subject?.last_position_status?.radio_state === 'alarm'),
    [subjectStore]
  );

  const previousSubjectsWithAlarmRadioState = useRef(subjectsWithAlarmRadioState?.map((subject) => subject.id));

  useEffect(() => {
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
            type: 'error',
          },
        });
      });
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
