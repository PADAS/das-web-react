import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import GpsFormatToggle from '../GpsFormatToggle';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';


const SubjectMessagePopup = (props) => {
  const  { data: { subject, message } } = props; 


  return <Popup /*  offset={[20, 20]} */ coordinates={[message.device_location.longitude, message.device_location.latitude]} id={`message-popup-${message.id}`}>
    <h6><ChatIcon /> {subject.name}</h6>
    <p>{message.text}</p>
    <GpsFormatToggle lng={message.device_location.longitude} lat={message.device_location.latitude} />
  </Popup>;
};

export default memo(SubjectMessagePopup);

SubjectMessagePopup.propTypes = {
  data: PropTypes.object.isRequired,
};
