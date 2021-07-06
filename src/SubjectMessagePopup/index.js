import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import { withMap } from '../EarthRangerMap';
import { getSubjectLastPositionCoordinates } from '../utils/subjects';
import { jumpToLocation } from '../utils/map';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';


const SubjectMessagePopup = (props) => {
  const  { map, data: { subject, message } } = props; 

  const onTitleClick = () => {
    const coordinates = getSubjectLastPositionCoordinates(subject);
    jumpToLocation(map, coordinates);
  };

  return <Popup /*  offset={[20, 20]} */ coordinates={[message.device_location.longitude, message.device_location.latitude]} id={`message-popup-${message.id}`}>
    <h6 onClick={onTitleClick}><ChatIcon /> {subject.name}</h6>
    <p style={{marginBottom: '0.25rem'}}>{message.text}</p>
    <DateTime date={message.message_time}  />
    <GpsFormatToggle lng={message.device_location.longitude} lat={message.device_location.latitude} />
  </Popup>;
};

export default memo(withMap(SubjectMessagePopup));

SubjectMessagePopup.propTypes = {
  data: PropTypes.object.isRequired,
};
