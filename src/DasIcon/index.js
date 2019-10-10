import React, { memo } from 'react';
import PropTypes from 'prop-types';

const spriteMappings = {
  events: {
    id: 'reportTypeIconSprite',
    prefix: 'das--activity--static--sprite-src--',
  },
};

const calcIconUrl = (type, iconId) => {
  const SPRITE_ID = spriteMappings[type].id;
  const ICON_PREFIX = spriteMappings[type].prefix;

  const iconIdMatch = document.querySelector(`#${SPRITE_ID} #${ICON_PREFIX}${iconId}`);
  const iconIdRepMatch = document.querySelector(`#${SPRITE_ID} #${ICON_PREFIX}${iconId}_rep`);
  if (iconIdMatch) {
    return `#${ICON_PREFIX}${iconId}`;
  }
  else if (iconIdRepMatch) {
    return `#${ICON_PREFIX}${iconId}_rep`;
  } else {
    return `#${ICON_PREFIX}generic_rep`;
  }
};

const DasIcon = (props) => {
  const { type, iconId, color, dispatch:_dispatch, ...rest } = props;
  return (
    <svg {...rest} fill={color}>
      <use href={calcIconUrl(type, iconId)} />
    </svg>
  );
};

export default memo(DasIcon);

DasIcon.defaultProps = {
  color: 'white',
};

DasIcon.propTypes = {
  type: PropTypes.string.isRequired,
  iconId: PropTypes.string.isRequired,
  color: PropTypes.string,
};
