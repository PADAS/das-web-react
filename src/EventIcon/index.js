import React, { memo } from 'react';
import DasIcon from '../DasIcon';
import PropTypes from 'prop-types';

const EventIcon = memo(({iconId, type, ...rest}) => <DasIcon type="events" iconId={iconId} {...rest} />);

export default EventIcon;

EventIcon.propTypes = {
  iconId: PropTypes.string.isRequired,
};