import React from 'react';

import LegBoundaryListItem from '../DetailViewComponents/ActivitySection/LegBoundaryListItem';

// Produce activity-feed entries for leg starts, leg ends, and leg transitions.
//
// Rules:
// - Leg 1's start is always rendered as "<Patrol Type> Started" (the patrol start).
// - For leg N (> 1):
//   - If leg N-1's end stamp equals leg N's start stamp, emit ONE combined
//     "Leg N-1 Ended, Leg N Started" item shown on both legs' detail pages
//     and on the overview.
//   - If they differ, emit TWO separate items:
//       - "Leg N-1 Ended" — shown only on leg N-1's detail page
//       - "Leg N Started" — shown only on leg N's detail page
//     Both appear on the overview.
// - If the last leg has an end stamp (patrol ended explicitly), emit a final
//   "Leg N Ended" item.
//
// Pass `onlyLegIndex` to restrict output to a single leg's relevant items.
// Pass `jumpToDate(date)` to wire up the jump-to-location button on each item.
export const buildLegBoundaryItems = (legs, { onlyLegIndex, jumpToDate } = {}) => {
  // Each entry: { sortDate, node, legs: number[] } (legs lists indices the
  // item should appear on; the overview shows every entry).
  const items = [];

  const jumpFor = (date) => (jumpToDate && date ? () => jumpToDate(date) : undefined);

  legs.forEach((leg, i) => {
    const prev = legs[i - 1];

    if (i === 0) {
      // Leg 1 start = patrol start
      if (leg.startedAt) {
        items.push({
          sortDate: leg.startedAt,
          node: <LegBoundaryListItem
            key={`leg-start-${i}`}
            date={leg.startedAt}
            title={`${leg.patrolTypeLabel} Started`}
            onJumpToLocation={jumpFor(leg.startedAt)}
          />,
          legs: [i],
        });
      }
    } else {
      // Transition from prev → current
      const prevEnd = prev?.endedAt;
      const thisStart = leg.startedAt;
      const sameTime = prevEnd && thisStart && +prevEnd === +thisStart;

      if (sameTime) {
        items.push({
          sortDate: thisStart,
          node: <LegBoundaryListItem
            key={`leg-transition-${i}`}
            date={thisStart}
            title={`Leg ${prev.legNumber} ${prev.patrolTypeLabel} Ended, Leg ${leg.legNumber} ${leg.patrolTypeLabel} Started`}
            onJumpToLocation={jumpFor(thisStart)}
          />,
          legs: [i - 1, i],
        });
      } else {
        if (prevEnd) {
          items.push({
            sortDate: prevEnd,
            node: <LegBoundaryListItem
              key={`leg-end-${i - 1}`}
              date={prevEnd}
              title={`Leg ${prev.legNumber} ${prev.patrolTypeLabel} Ended`}
              onJumpToLocation={jumpFor(prevEnd)}
            />,
            legs: [i - 1],
          });
        }
        if (thisStart) {
          items.push({
            sortDate: thisStart,
            node: <LegBoundaryListItem
              key={`leg-start-${i}`}
              date={thisStart}
              title={`Leg ${leg.legNumber} ${leg.patrolTypeLabel} Started`}
              onJumpToLocation={jumpFor(thisStart)}
            />,
            legs: [i],
          });
        }
      }
    }

    // Final leg-ended marker (only for the last leg; intermediate legs are
    // already covered by the transition logic above).
    const isLast = i === legs.length - 1;
    if (isLast && leg.endedAt) {
      items.push({
        sortDate: leg.endedAt,
        node: <LegBoundaryListItem
          key={`leg-end-${i}`}
          date={leg.endedAt}
          title={`Leg ${leg.legNumber} ${leg.patrolTypeLabel} Ended`}
          onJumpToLocation={jumpFor(leg.endedAt)}
        />,
        legs: [i],
      });
    }
  });

  // eslint-disable-next-line no-unused-vars
  const strip = ({ legs: _legs, ...rest }) => rest;
  if (onlyLegIndex !== undefined) {
    return items.filter((item) => item.legs.includes(onlyLegIndex)).map(strip);
  }
  return items.map(strip);
};
