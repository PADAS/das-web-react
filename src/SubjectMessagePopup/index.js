import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';
import { getSubjectLastPositionCoordinates } from '../utils/subjects';
import useJumpToLocation from '../hooks/useJumpToLocation';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';


const SubjectMessagePopup = (props) => {
  const  { data: { subject, message } } = props;

  const jumpToLocation = useJumpToLocation();

  const onTitleClick = () => {
    const coordinates = getSubjectLastPositionCoordinates(subject);
    jumpToLocation(coordinates);
  };

  return <>
    <h6 onClick={onTitleClick}><ChatIcon /> {subject.name}</h6>
    <p style={{ marginBottom: '0.25rem' }}>{message.text}</p>
    <DateTime date={message.message_time}  />
    <GpsFormatToggle lng={message.device_location.longitude} lat={message.device_location.latitude} />
  </>;
};

export default memo(withMap(SubjectMessagePopup));

SubjectMessagePopup.propTypes = {
  data: PropTypes.object.isRequired,
};
