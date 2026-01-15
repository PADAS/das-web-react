import React, { memo } from 'react';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { calcDisplayNameForSubject, getSubjectLastPositionCoordinates } from '../utils/subjects';
import useJumpToLocation from '../hooks/useJumpToLocation';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

const SubjectMessagePopup = ({ data }) => {
  const jumpToLocation = useJumpToLocation();

  const { subject, message } = data;
  return <>
    <h6 onClick={() => jumpToLocation(getSubjectLastPositionCoordinates(subject))}>
      <ChatIcon /> {calcDisplayNameForSubject(subject.name)}
    </h6>

    <p style={{ marginBottom: '0.25rem' }}>{message.text}</p>

    <DateTime date={message.message_time} />

    <GpsFormatToggle lngLat={message.device_location} name="subjectMessagePopup-gpsFormatToggle" />
  </>;
};

export default memo(SubjectMessagePopup);
