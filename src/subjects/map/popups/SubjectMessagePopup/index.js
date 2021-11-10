import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../../../../map/EarthRangerMap';
import { getSubjectLastPositionCoordinates } from '../../../../utils/subjects';
import { jumpToLocation } from '../../../../utils/map';

import DateTime from '../../../../common/components/date/DateTime';
import GpsFormatToggle from '../../../../user/preferences/GpsFormatToggle';
import { ReactComponent as ChatIcon } from '../../../../common/images/icons/chat-icon.svg';


const SubjectMessagePopup = (props) => {
  const  { map, data: { subject, message } } = props;

  const onTitleClick = () => {
    const coordinates = getSubjectLastPositionCoordinates(subject);
    jumpToLocation(map, coordinates);
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
