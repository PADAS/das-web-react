import React, { memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { API_V2_URL } from '../constants';

const spriteMappings = {
  events: {
    id: 'reportTypeIconSprite',
    prefix: 'das--activity--static--sprite-src--',
  },
};

export const calcIconUrl = (type, iconId) => {
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

const DasIcon = ({ type, iconId, color = 'gray', dispatch: _dispatch, className, ...rest }) => {
  const communityValue = useSelector((state) => state.data.community?.value);
  const [erroredIconId, setErroredIconId] = useState(null);

  if (communityValue && type === 'events' && iconId) {
    if (erroredIconId === iconId) {
      return null;
    }

    return (
      <img
        alt=""
        className={className || ''}
        onError={() => setErroredIconId(iconId)}
        src={`${API_V2_URL}community/${communityValue}/activity/events/eventtypes/icons/${iconId}`}
        {...rest}
      />
    );
  }

  const svgHref = calcIconUrl(type, iconId);

  const isGeneric = svgHref.includes('generic');

  return (
    <svg className={`${className || ''} ${isGeneric ? 'generic' : ''}`} {...rest} fill={color}>
      <use href={svgHref} />
    </svg>
  );
};

export default memo(DasIcon);
