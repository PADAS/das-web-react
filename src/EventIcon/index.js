import React, { memo } from 'react';
import DasIcon from '../DasIcon';
import PropTypes from 'prop-types';

const EventIcon = ({iconId, ...rest}) => <DasIcon type='events' iconId={iconId} {...rest} />;

export default memo(EventIcon);

EventIcon.propTypes = {
  iconId: PropTypes.string.isRequired,
};