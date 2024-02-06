import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { getSubjectLastPositionCoordinates } from '../utils/subjects';
import useJumpToLocation from '../hooks/useJumpToLocation';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

const SubjectMessagePopup = ({ data }) => {
  const jumpToLocation = useJumpToLocation();

  const { subject, message } = data;
  return <>
    <h6 onClick={() => jumpToLocation(getSubjectLastPositionCoordinates(subject))}>
      <ChatIcon /> {subject.name}
    </h6>

    <p style={{ marginBottom: '0.25rem' }}>{message.text}</p>

    <DateTime date={message.message_time} />

    <GpsFormatToggle lat={message.device_location.latitude} lng={message.device_location.longitude} />
  </>;
};

SubjectMessagePopup.propTypes = {
  data: PropTypes.shape({
    message: PropTypes.shape({
      device_location: PropTypes.shape({
        latitude: PropTypes.number,
        longitude: PropTypes.number,
      }),
      message_time: PropTypes.string,
      text: PropTypes.string,
    }),
    subject: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
};

export default memo(SubjectMessagePopup);
