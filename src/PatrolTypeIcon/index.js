import React, { memo } from 'react';

import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';

// Map a patrol type name to a sprite icon id (in the events sprite). Types not
// listed here fall back to the local PatrolIcon SVG (used so far for Foot /
// Routine patrols).
const SPRITE_ICON_BY_TYPE = {
  'Aerial Patrol': 'plane-patrol-icon',
  'Vehicle Patrol': 'vehicle-patrol-icon',
};

// The sprite icons already include the built-in "P" badge — consumers can use
// this to decide whether to draw an additional overlay.
export const hasBuiltInPBadge = (patrolType) => !!SPRITE_ICON_BY_TYPE[patrolType];

const ICON_PREFIX = 'das--activity--static--sprite-src--';

// Renders the right icon for a patrol type:
//   Aerial / Vehicle → sprite <use> reference (plane / vehicle, each with the
//     built-in P)
//   Foot / Routine / unknown → local PatrolIcon SVG
//
// We reference the sprite symbol directly (instead of going through DasIcon's
// `calcIconUrl` lookup) because that helper queries the DOM at render time and
// falls back to `generic_rep` if the sprite hasn't been committed yet.
const PatrolTypeIcon = ({ patrolType, className, color = 'currentColor', ...rest }) => {
  const spriteIconId = SPRITE_ICON_BY_TYPE[patrolType];
  if (spriteIconId) {
    // Default size matches the intrinsic PatrolIcon (24×24); consumer CSS on
    // `className` can override.
    return <svg width="24" height="24" className={className} fill={color} {...rest}>
      <use href={`#${ICON_PREFIX}${spriteIconId}`} />
    </svg>;
  }
  return <PatrolIcon className={className} {...rest} />;
};

export default memo(PatrolTypeIcon);
