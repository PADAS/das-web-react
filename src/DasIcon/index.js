import React, { memo } from 'react';
import { API_V2_URL, DAS_HOST } from '../constants';

const GENERIC_ICON_ID = 'generic_rep';

const DasIcon = ({ type, iconId, imageUrl, color: _color, dispatch: _dispatch, className, ...rest }) => {
  if (type === 'subjects') {
    return (
      <img
        alt=""
        className={className || ''}
        onError={(e) => { e.target.style.display = 'none'; }}
        src={imageUrl}
        {...rest}
      />
    );
  }

  if (window.location.pathname.startsWith('/community') && iconId) {
    const communityValue = window.location.pathname.split('/')[2];
    return (
      <img
        alt=""
        className={className || ''}
        onError={(e) => { e.target.style.display = 'none'; }}
        src={`${API_V2_URL}community/${communityValue}/activity/events/eventtypes/icons/${iconId}`}
        {...rest}
      />
    );
  }

  const effectiveIconId = iconId || GENERIC_ICON_ID;
  const isGeneric = effectiveIconId.includes('generic');

  const handleError = (e) => {
    if (!e.target.src.includes(GENERIC_ICON_ID)) {
      e.target.src = `${DAS_HOST}/static/sprite-src/${GENERIC_ICON_ID}.svg`;
      e.target.classList.add('generic');
    } else {
      e.target.style.display = 'none';
    }
  };

  return (
    <img
      alt=""
      className={`${className || ''} ${isGeneric ? 'generic' : ''}`}
      onError={handleError}
      src={`${DAS_HOST}/static/sprite-src/${effectiveIconId}.svg`}
      {...rest}
    />
  );
};

export default memo(DasIcon);
