import { createSelector } from 'reselect';
import { isAfter } from 'date-fns';
import { length } from '@turf/turf';
import { shallowEqual } from 'react-redux';
import uniq from 'lodash/uniq';

import { buildTrackSegments, trackLengthWithinTimeRange, trimTrackDataToTimeRange } from '../../utils/tracks';
import {
  actualStartTimeForPatrolSegment,
  displayNumberForPatrolSegment,
  drawPatrolTrackConnectorLines,
  effectiveEndTimeForPatrol,
  effectiveEndTimeForPatrolSegment,
  extractLegPatrolPoints,
  extractPausePatrolPoint,
  finalizeCombinedPatrolPoints,
  getTrackedSubjectsForPatrolSegment,
  isPatrolSegmentAPause,
  isSegmentActiveForPatrol,
  isSegmentPending,
  makePatrolLegMarkerPoint,
  makePatrolPauseMarkerPoint,
  patrolStateAllowsTrackDisplay,
} from '../../utils/patrols';
import { getSubjectLastPositionCoordinates } from '../../utils/subjects';
import { selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod, selectTrackTimeEnvelope } from '../tracks';

const EMPTY_HIDDEN_SUBJECT_IDS = [];

// A leg that never started bounds nothing, so it leaves the window as it is.
const earliestTime = (time, otherTime) => {
  if (!time || !otherTime) {
    return time ?? otherTime;
  }

  return new Date(time).getTime() < new Date(otherTime).getTime() ? time : otherTime;
};

// A leg still open runs up to now, which no end time can stand in for.
const latestTimeOrOpenEnded = (time, otherTime) => {
  if (!time || !otherTime) {
    return null;
  }

  return new Date(time).getTime() > new Date(otherTime).getTime() ? time : otherTime;
};

const clampTrackTimeRangeEnd = (until, trackTimeEnvelopeUntil) => {
  if (!trackTimeEnvelopeUntil) {
    return until;
  }

  if (!until) {
    return trackTimeEnvelopeUntil;
  }

  return new Date(trackTimeEnvelopeUntil).getTime() < new Date(until).getTime() ? trackTimeEnvelopeUntil : until;
};

const clampTrackTimeRangeStart = (since, trackTimeEnvelopeFrom) => {
  if (!trackTimeEnvelopeFrom) {
    return since;
  }

  if (!since) {
    return trackTimeEnvelopeFrom;
  }

  return new Date(trackTimeEnvelopeFrom).getTime() > new Date(since).getTime() ? trackTimeEnvelopeFrom : since;
};

// The stretch of a time range the track length setting still reaches back to,
// or nothing when the range has scrolled out of that window entirely.
const clampTimeRangeToTrackTimeEnvelope = (timeRange, trackTimeEnvelope) => {
  const since = clampTrackTimeRangeStart(timeRange.since, trackTimeEnvelope.from);
  const until = clampTrackTimeRangeEnd(timeRange.until, trackTimeEnvelope.until);

  return until && new Date(since).getTime() > new Date(until).getTime() ? null : { since, until };
};

// The time a subject spent on the patrol, in the shape the track helpers take.
const patrolTimeRanges = (patrol, patrolSegments) => mergeSegmentTimeRanges(patrol, patrolSegments)
  .map((timeRange) => ({ since: timeRange.since, until: timeRange.until === Infinity ? null : timeRange.until }));

// The stretch of the patrol a leg ran for: a leg the record left open still
// ended when the patrol closed or the next leg took over.
const patrolSegmentTimeRange = (patrol, patrolSegment) => ({
  since: actualStartTimeForPatrolSegment(patrolSegment).getTime(),
  until: effectiveEndTimeForPatrolSegment(patrol, patrolSegment)?.getTime() ?? Infinity,
});

// The time a subject spent on the patrol, as a set of ranges that do not
// overlap.
const mergeSegmentTimeRanges = (patrol, patrolSegments) => patrolSegments
  .filter((patrolSegment) => patrolSegment.time_range?.start_time)
  .map((patrolSegment) => patrolSegmentTimeRange(patrol, patrolSegment))
  .sort((timeRange, otherTimeRange) => timeRange.since - otherTimeRange.since)
  .reduce((mergedTimeRanges, timeRange) => {
    const lastMergedTimeRange = mergedTimeRanges[mergedTimeRanges.length - 1];

    if (lastMergedTimeRange && timeRange.since <= lastMergedTimeRange.until) {
      lastMergedTimeRange.until = Math.max(lastMergedTimeRange.until, timeRange.until);
    } else {
      mergedTimeRanges.push({ ...timeRange });
    }

    return mergedTimeRanges;
  }, []);

// A leg the patrol actually ran. A pause covered no ground, and a leg still to
// come has covered none yet.
const hasPatrolSegmentRun = (patrolSegment) =>
  !isPatrolSegmentAPause(patrolSegment) && !isSegmentPending(patrolSegment);

// The kilometers a subject covered during a time range: its own track, bounded
// to that range.
const distanceCoveredInTimeRange = ({ since, until }, subjectTrack) =>
  trackLengthWithinTimeRange(subjectTrack, since, until === Infinity ? null : until);

// The subjects a leg's distance is read from. A lead answers for its leg;
// without one, the furthest of the subjects it tracks stands in for it.
const measuredSubjectsForPatrolSegment = (patrolSegment, trackedSubjects) => patrolSegment.leader
  ? trackedSubjects.filter((subject) => subject.id === patrolSegment.leader.id)
  : trackedSubjects;

// The kilometers a leg covered, or nothing until every subject it is measured
// by has a track: the furthest of those that arrived is not the furthest of all.
const legDistanceForPatrolSegment = (patrol, patrolSegment, trackedSubjects, tracks) => {
  const measuredSubjects = measuredSubjectsForPatrolSegment(patrolSegment, trackedSubjects);

  if (!measuredSubjects.length || measuredSubjects.some((subject) => !tracks[subject.id])) {
    return null;
  }

  return Math.max(...measuredSubjects.map((subject) =>
    distanceCoveredInTimeRange(patrolSegmentTimeRange(patrol, patrolSegment), tracks[subject.id])));
};

// Every subject the given legs track, each paired with the legs it is on.
const groupPatrolSegmentsByTrackedSubject = (patrolSegments, teamAndTrackingOptions, rosterFallbackSubjects) => {
  const trackedSubjectsMap = new Map();

  patrolSegments.forEach((patrolSegment) => {
    getTrackedSubjectsForPatrolSegment(
      patrolSegment,
      teamAndTrackingOptions,
      rosterFallbackSubjects
    ).forEach((subject) => {
      const trackedSubject = trackedSubjectsMap.get(subject.id) ?? { patrolSegments: [], subject };

      trackedSubject.patrolSegments.push(patrolSegment);

      trackedSubjectsMap.set(subject.id, trackedSubject);
    });
  });

  return [...trackedSubjectsMap.values()];
};

// Tracks are stored most recent position first, and that has to hold for a
// track stitched out of several of them.
const combineTrackData = (trackDataList) => {
  if (!trackDataList.length) {
    return null;
  }

  return {
    points: {
      type: 'FeatureCollection',
      features: trackDataList
        .flatMap((trackData) => trackData.points?.features ?? [])
        .sort((trackPoint, otherTrackPoint) =>
          new Date(otherTrackPoint.properties.time).getTime() - new Date(trackPoint.properties.time).getTime()),
    },
    track: {
      type: 'FeatureCollection',
      features: trackDataList.flatMap((trackData) => trackData.track?.features ?? []),
    },
  };
};

// Trimming a window a subject has no positions in keeps the one position
// nearest it, which belongs neither to the patrol nor on the map.
const trimTrackDataToPatrolTimeRange = (subjectTrack, since, until) => {
  const trimmedTrackData = trimTrackDataToTimeRange(subjectTrack, since, until);

  // Times run most recent first, so the first one kept is the latest in range.
  const [latestTime] = trimmedTrackData.track.features[0]?.properties?.coordinateProperties?.times ?? [];

  if (!latestTime) {
    return null;
  }

  const isLatestTimeInRange = new Date(latestTime).getTime() >= new Date(since).getTime()
    && (!until || new Date(latestTime).getTime() <= new Date(until).getTime());

  return isLatestTimeInRange ? trimmedTrackData : null;
};

// A subject's patrol track: its own, cut to the stretches it spent on the
// patrol and kept apart, so no line crosses the time it was off the patrol.
const buildTrackedSubjectTrackData = (patrol, trackedSubject, tracks, trackTimeEnvelope = null) => {
  const subjectTrack = tracks[trackedSubject.subject.id];

  if (!subjectTrack) {
    return null;
  }

  // The merged ranges come out oldest first, tracks the other way around.
  return combineTrackData(patrolTimeRanges(patrol, trackedSubject.patrolSegments)
    .reverse()
    .map((timeRange) => trackTimeEnvelope
      ? clampTimeRangeToTrackTimeEnvelope(timeRange, trackTimeEnvelope)
      : timeRange)
    .filter(Boolean)
    .map((timeRange) => trimTrackDataToPatrolTimeRange(subjectTrack, timeRange.since, timeRange.until))
    .filter(Boolean));
};

// One subject's track alone, since the start, end and hand-over markers a
// patrol draws all sit on a single line: its lead's, or, with no lead, the
// first subject it tracks.
const buildPatrolSegmentLeadTrackData = (patrol, patrolSegment, trackedSubjects, tracks, virtualDate) => {
  const lead = patrolSegment.leader ?? trackedSubjects[0] ?? null;
  const rawTrackData = lead ? (tracks[lead.id] || null) : null;
  const startTime = patrolSegment.time_range?.start_time;
  const endTime = clampTrackTimeRangeEnd(effectiveEndTimeForPatrolSegment(patrol, patrolSegment), virtualDate);

  const trackData = (!!rawTrackData
    && !!startTime
    && trimTrackDataToPatrolTimeRange(rawTrackData, startTime, endTime)) || null;

  return { lead, rawTrackData, trackData };
};

// Where the leg before a pause left the patrol, which is what the pause stands
// on when the pause itself was logged nowhere.
const lastLegEndPointBefore = (patrolSegmentsPoints, patrolSegmentIndex) => patrolSegmentsPoints
  .slice(0, patrolSegmentIndex)
  .reverse()
  .find((patrolSegmentPoints) => !!patrolSegmentPoints?.end_location)
  ?.end_location ?? null;

// Where a patrol starts, where it ends, where each leg hands over to the next,
// and where it stood still.
const buildPatrolPoints = (patrol, patrolSegmentsLeadTrackData) => {
  const patrolSegmentsPoints = patrol.patrol_segments.map((patrolSegment, index) => {
    const leadTrackData = patrolSegmentsLeadTrackData[index];

    return leadTrackData
      ? extractLegPatrolPoints(
        patrolSegment,
        leadTrackData.lead,
        leadTrackData.trackData,
        leadTrackData.rawTrackData,
        isSegmentActiveForPatrol(patrol, patrolSegment)
      )
      : null;
  });

  // A patrol still running ends nowhere: the marker would otherwise fall back
  // to where the leg before the running one handed over.
  const hasSegmentRunning = patrol.patrol_segments
    .some((patrolSegment) => isSegmentActiveForPatrol(patrol, patrolSegment));

  // The leg the patrol opens on is the one its start marker stands for, so it
  // takes no hand-over marker of its own on top of it.
  const startPatrolSegmentIndex = patrolSegmentsPoints
    .findIndex((patrolSegmentPoints) => !!patrolSegmentPoints?.start_location);

  return {
    end_location: hasSegmentRunning
      ? null
      : [...patrolSegmentsPoints]
        .reverse()
        .find((patrolSegmentPoints) => !!patrolSegmentPoints?.end_location)?.end_location ?? null,
    // Every leg after the one the patrol opened on shows where it took over,
    // and a pause stands where the leg before it was last seen.
    legMarkers: patrol.patrol_segments
      .map((patrolSegment, index) => {
        if (index === startPatrolSegmentIndex) {
          return null;
        }

        const displayNumber = displayNumberForPatrolSegment(patrol.patrol_segments, index);

        if (isPatrolSegmentAPause(patrolSegment)) {
          const pausePoint = extractPausePatrolPoint(patrolSegment, lastLegEndPointBefore(patrolSegmentsPoints, index));

          return pausePoint ? makePatrolPauseMarkerPoint(displayNumber, pausePoint) : null;
        }

        return patrolSegmentsPoints[index]?.start_location
          ? makePatrolLegMarkerPoint(displayNumber, patrolSegmentsPoints[index].start_location)
          : null;
      })
      .filter(Boolean),
    start_location: patrolSegmentsPoints[startPatrolSegmentIndex]?.start_location ?? null,
  };
};

// A point the time slider has not reached yet has not happened yet.
const isPatrolPointBeforeVirtualDate = (patrolPoint, virtualDate) => !patrolPoint?.properties?.time
  || !isAfter(new Date(patrolPoint.properties.time), virtualDate);

// The time slider rewinds a patrol to a moment it may not have ended in yet,
// and one that has not ended takes no end marker, estimated or otherwise.
const hasPatrolEndedByVirtualDate = (patrol, virtualDate) => {
  const patrolEndTime = effectiveEndTimeForPatrol(patrol);

  return !!patrolEndTime && !isAfter(patrolEndTime, virtualDate);
};

const buildPatrolStartStopGeometries = (patrol, patrolSegmentsTrackedSubjects, timeSliderState, tracks) => {
  const virtualDate = timeSliderState.active && timeSliderState.virtualDate
    ? new Date(timeSliderState.virtualDate)
    : null;
  const hasPatrolEnded = !virtualDate || hasPatrolEndedByVirtualDate(patrol, virtualDate);

  // The markers sit on the line the leads made. A pause tracks nobody and a leg
  // still to come has been nowhere, so neither puts the patrol anywhere.
  const patrolSegmentsLeadTrackData = patrol.patrol_segments.map((patrolSegment, index) =>
    hasPatrolSegmentRun(patrolSegment)
      ? buildPatrolSegmentLeadTrackData(
        patrol,
        patrolSegment,
        patrolSegmentsTrackedSubjects[index],
        tracks,
        virtualDate
      )
      : null);

  const patrolPoints = buildPatrolPoints(patrol, patrolSegmentsLeadTrackData);

  if (virtualDate) {
    if (!isPatrolPointBeforeVirtualDate(patrolPoints.start_location, virtualDate)) {
      patrolPoints.start_location = null;
    }

    // Where a track had reached when the slider stopped is not where the patrol
    // finished, and one the slider left mid-run has not finished at all.
    if (!hasPatrolEnded || !isPatrolPointBeforeVirtualDate(patrolPoints.end_location, virtualDate)) {
      patrolPoints.end_location = null;
    }

    patrolPoints.legMarkers = patrolPoints.legMarkers
      .filter((legMarker) => isPatrolPointBeforeVirtualDate(legMarker, virtualDate));
  }

  if (!patrolPoints.start_location && !patrolPoints.end_location && !patrolPoints.legMarkers.length) {
    return null;
  }

  const finalizedPatrolPoints = finalizeCombinedPatrolPoints(patrol, patrolPoints, hasPatrolEnded);

  return {
    // The dashed lines reach to the leads' line, not every subject's: hiding a
    // subject in the legend leaves where the patrol began and ended alone.
    lines: drawPatrolTrackConnectorLines(
      finalizedPatrolPoints,
      combineTrackData(patrolSegmentsLeadTrackData
        .map((leadTrackData) => leadTrackData?.trackData)
        .filter(Boolean))
    ),
    points: {
      type: 'FeatureCollection',
      features: [
        finalizedPatrolPoints.start_location,
        ...finalizedPatrolPoints.legMarkers,
        finalizedPatrolPoints.end_location,
      ].filter(Boolean),
    },
  };
};

const buildPatrolSubjectsTrackData = (patrol, trackedSubjects, patrolTrackContext) => {
  // The last leg's leader is used for title/display purposes, since it's the
  // most recent one.
  const patrolLeader = patrol.patrol_segments[patrol.patrol_segments.length - 1]?.leader || null;

  if (!patrolStateAllowsTrackDisplay(patrol)) {
    return {
      hasTrackData: false,
      leader: patrolLeader,
      subjectsTrackData: [],
      trackData: null,
    };
  }

  const subjectsTrackData = trackedSubjects.map((trackedSubject) => {
    const trackData = buildTrackedSubjectTrackData(
      patrol,
      trackedSubject,
      patrolTrackContext.tracks,
      patrolTrackContext.trackTimeEnvelope
    );

    return {
      distance: trackData ? length(trackData.track) : null,
      isHidden: patrolTrackContext.hiddenSubjectIds.includes(trackedSubject.subject.id),
      subject: trackedSubject.subject,
      trackData: trackData && patrolTrackContext.isTimeOfDayColoringActive
        ? { ...trackData, trackSegments: buildTrackSegments(trackData.track, patrolTrackContext.timeOfDayTimeZone) }
        : trackData,
    };
  });

  const trackData = combineTrackData(subjectsTrackData
    .filter((subjectTrackData) => !subjectTrackData.isHidden && !!subjectTrackData.trackData)
    .map((subjectTrackData) => subjectTrackData.trackData));

  return {
    hasTrackData: subjectsTrackData.some((subjectTrackData) => !!subjectTrackData.trackData),
    leader: patrolLeader,
    subjectsTrackData,
    trackData,
  };
};

// Every subject the given legs track, with the total distance it covered
// across them — unknown until that subject's track has loaded.
const buildTrackedSubjects = (
  trackedSubjectTracks,
  trackedSubjectPositions,
  teamAndTrackingOptions,
  rosterFallbackSubjects,
  patrol,
  patrolSegments,
  teamLeadId
) => groupPatrolSegmentsByTrackedSubject(patrolSegments, teamAndTrackingOptions, rosterFallbackSubjects)
  .map((trackedSubject) => {
    const subjectTrack = trackedSubjectTracks[trackedSubject.subject.id];

    return {
      // Tracks are stored most recent position first.
      coordinates: subjectTrack?.points?.features?.[0]?.geometry?.coordinates
        ?? trackedSubjectPositions[trackedSubject.subject.id]
        ?? null,
      distance: subjectTrack
        ? mergeSegmentTimeRanges(patrol, trackedSubject.patrolSegments).reduce(
          (distance, timeRange) => distance + distanceCoveredInTimeRange(timeRange, subjectTrack),
          0
        )
        : null,
      isTeamLead: trackedSubject.subject.id === teamLeadId,
      subject: trackedSubject.subject,
    };
  })
  // The team lead comes first.
  .sort((trackedSubject, otherTrackedSubject) => otherTrackedSubject.isTeamLead - trackedSubject.isTeamLead);

// The subjects the given patrols' legs name that the rosters no longer offer,
// looked up in the subject store.
const buildRosterFallbackSubjects = (patrols, teamAndTrackingOptions, subjectStore) => {
  const offeredRosterIds = new Set([
    ...(teamAndTrackingOptions?.assets ?? []),
    ...(teamAndTrackingOptions?.members ?? []),
  ].map((rosterOption) => rosterOption.id));

  return patrols.reduce((fallbackSubjects, patrol) => {
    (patrol.patrol_segments ?? []).forEach((patrolSegment) => {
      [...(patrolSegment.assets ?? []), ...(patrolSegment.members ?? [])].forEach((rosterId) => {
        if (!offeredRosterIds.has(rosterId) && subjectStore?.[rosterId]) {
          fallbackSubjects[rosterId] = subjectStore[rosterId];
        }
      });
    });

    return fallbackSubjects;
  }, {});
};

// Only the tracks of the subjects these patrols track, so a socket update to
// some other subject does not invalidate the trimming work below.
const buildTrackedSubjectTracks = (patrols, teamAndTrackingOptions, rosterFallbackSubjects, tracks) =>
  patrols.reduce((trackedSubjectTracks, patrol) => {
    (patrol.patrol_segments ?? []).forEach((patrolSegment) => {
      getTrackedSubjectsForPatrolSegment(
        patrolSegment,
        teamAndTrackingOptions,
        rosterFallbackSubjects
      ).forEach((subject) => {
        if (tracks[subject.id]) {
          trackedSubjectTracks[subject.id] = tracks[subject.id];
        }
      });
    });

    return trackedSubjectTracks;
  }, {});

// Rows the map's own selectors already memoized, so each one holds its identity
// for as long as the patrol it stands for does.
const arePatrolsTracksDataEqual = (patrolsTracksData, otherPatrolsTracksData) =>
  patrolsTracksData.length === otherPatrolsTracksData.length
  && patrolsTracksData.every((patrolTracksData, index) =>
    shallowEqual(patrolTracksData, otherPatrolsTracksData[index]));

const selectHiddenPatrolTrackedSubjects = (state) => state.view.patrolTrackState.hiddenSubjects;
const selectIsTimeOfDayColoringActive = (state) => state.view.trackSettings.isTimeOfDayColoringActive;
const selectPatrolsFeed = (state) => state.data.patrolsFeed;
const selectPatrolLeaders = (state) => state.data.patrolTeamAndTrackingOptions.leaders;
const selectPatrolStore = (state) => state.data.patrolStore;
const selectPatrolTeamAndTrackingOptions = (state) => state.data.patrolTeamAndTrackingOptions;
const selectPatrolTrackState = (state) => state.view.patrolTrackState;
const selectSubjectStore = (state) => state.data.subjectStore;
const selectTimeOfDayTimeZone = (state) => state.view.trackSettings.timeOfDayTimeZone;
const selectTimeSliderState = (state) => state.view.timeSliderState;
const selectTracks = (state) => state.data.tracks;

const selectVisibleAndPinnedPatrolTracks = createSelector(
  [selectPatrolTrackState],
  (patrolTrackState) => uniq([...patrolTrackState.visible, ...patrolTrackState.pinned])
);

// The subjects a patrol's legs name that its rosters no longer offer. Held
// apart from the store, so a position a socket brings in invalidates nothing.
export const selectPatrolRosterFallbackSubjects = createSelector(
  [selectPatrolTeamAndTrackingOptions, selectSubjectStore, (_, patrol) => patrol],
  (patrolTeamAndTrackingOptions, subjectStore, patrol) =>
    buildRosterFallbackSubjects([patrol], patrolTeamAndTrackingOptions, subjectStore),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

const selectPatrolTrackedSubjectTracks = createSelector(
  [selectPatrolTeamAndTrackingOptions, selectPatrolRosterFallbackSubjects, selectTracks, (_, patrol) => patrol],
  (patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects, tracks, patrol) =>
    buildTrackedSubjectTracks([patrol], patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects, tracks),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

const selectPatrolTrackedSubjectsWithPatrolSegments = createSelector(
  [selectPatrolTeamAndTrackingOptions, selectPatrolRosterFallbackSubjects, (_, patrol) => patrol],
  (patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects, patrol) => groupPatrolSegmentsByTrackedSubject(
    patrol.patrol_segments,
    patrolTeamAndTrackingOptions,
    patrolRosterFallbackSubjects
  )
);

// The subjects each of a patrol's legs tracks, index aligned with its legs.
const selectPatrolSegmentsTrackedSubjects = createSelector(
  [selectPatrolTeamAndTrackingOptions, selectPatrolRosterFallbackSubjects, (_, patrol) => patrol],
  (patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects, patrol) => patrol.patrol_segments
    .map((patrolSegment) => getTrackedSubjectsForPatrolSegment(
      patrolSegment,
      patrolTeamAndTrackingOptions,
      patrolRosterFallbackSubjects
    ))
);

// What the map draws: the track length setting narrows the lines, and the
// subjects the user hid in the legend drop out of them.
const selectPatrolMapTrackContext = createSelector(
  [
    selectHiddenPatrolTrackedSubjects,
    selectIsTimeOfDayColoringActive,
    selectPatrolTrackedSubjectTracks,
    selectTimeOfDayTimeZone,
    selectTrackTimeEnvelope,
    (_, patrol) => patrol.id,
  ],
  (
    hiddenPatrolTrackedSubjects,
    isTimeOfDayColoringActive,
    patrolTrackedSubjectTracks,
    timeOfDayTimeZone,
    trackTimeEnvelope,
    patrolId
  ) => ({
    hiddenSubjectIds: hiddenPatrolTrackedSubjects[patrolId] ?? EMPTY_HIDDEN_SUBJECT_IDS,
    isTimeOfDayColoringActive,
    timeOfDayTimeZone,
    trackTimeEnvelope,
    tracks: patrolTrackedSubjectTracks,
  })
);

// What the patrol covered: the views that report on the patrol answer for it,
// not for the window the map draws or the rows folded away in its legend.
const selectPatrolTrackContext = createSelector(
  [selectPatrolTrackedSubjectTracks],
  (patrolTrackedSubjectTracks) => ({
    hiddenSubjectIds: EMPTY_HIDDEN_SUBJECT_IDS,
    isTimeOfDayColoringActive: false,
    timeOfDayTimeZone: null,
    trackTimeEnvelope: null,
    tracks: patrolTrackedSubjectTracks,
  })
);

// Where a patrol began, handed over, stood still and ended, held apart from
// its lines: the time slider moves these pins and leaves those alone.
const selectPatrolStartStopGeometries = createSelector(
  [
    selectPatrolSegmentsTrackedSubjects,
    selectPatrolTrackedSubjectTracks,
    selectTimeSliderState,
    (_, patrol) => patrol,
  ],
  (patrolSegmentsTrackedSubjects, patrolTrackedSubjectTracks, timeSliderState, patrol) =>
    patrolStateAllowsTrackDisplay(patrol)
      ? buildPatrolStartStopGeometries(
        patrol,
        patrolSegmentsTrackedSubjects,
        timeSliderState,
        patrolTrackedSubjectTracks
      )
      : null
);

const selectPatrolSubjectsTrackData = createSelector(
  [selectPatrolTrackedSubjectsWithPatrolSegments, selectPatrolTrackContext, (_, patrol) => patrol],
  (patrolTrackedSubjectsWithPatrolSegments, patrolTrackContext, patrol) =>
    buildPatrolSubjectsTrackData(patrol, patrolTrackedSubjectsWithPatrolSegments, patrolTrackContext)
);

const selectPatrolMapSubjectsTrackData = createSelector(
  [selectPatrolTrackedSubjectsWithPatrolSegments, selectPatrolMapTrackContext, (_, patrol) => patrol],
  (patrolTrackedSubjectsWithPatrolSegments, patrolMapTrackContext, patrol) =>
    buildPatrolSubjectsTrackData(patrol, patrolTrackedSubjectsWithPatrolSegments, patrolMapTrackContext)
);

export const selectPatrolTrackData = createSelector(
  [selectPatrolStartStopGeometries, selectPatrolSubjectsTrackData],
  (patrolStartStopGeometries, patrolSubjectsTrackData) =>
    ({ ...patrolSubjectsTrackData, startStopGeometries: patrolStartStopGeometries })
);

export const selectPatrolMapTrackData = createSelector(
  [selectPatrolStartStopGeometries, selectPatrolMapSubjectsTrackData],
  (patrolStartStopGeometries, patrolMapSubjectsTrackData) =>
    ({ ...patrolMapSubjectsTrackData, startStopGeometries: patrolStartStopGeometries })
);

// The ground a patrol covered: what each of its legs covered, added up.
export const selectPatrolLeadSumDistance = createSelector(
  [
    selectPatrolTeamAndTrackingOptions,
    selectPatrolRosterFallbackSubjects,
    selectPatrolTrackedSubjectTracks,
    (_, patrol) => patrol,
  ],
  (patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects, patrolTrackedSubjectTracks, patrol) => {
    if (!patrolStateAllowsTrackDisplay(patrol)) {
      return null;
    }

    const legDistances = patrol.patrol_segments
      .filter(hasPatrolSegmentRun)
      .map((patrolSegment) => legDistanceForPatrolSegment(
        patrol,
        patrolSegment,
        getTrackedSubjectsForPatrolSegment(patrolSegment, patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects),
        patrolTrackedSubjectTracks
      ));

    // A leg whose tracks have not arrived would leave a part of the patrol
    // reading as the whole of it, so the patrol waits for every leg it ran.
    return legDistances.length && legDistances.every((legDistance) => legDistance !== null)
      ? legDistances.reduce((leadSumDistance, legDistance) => leadSumDistance + legDistance, 0)
      : null;
  }
);

// The subjects the patrol's distance is read from. The feed measures every
// patrol it lists, so a lead on every leg costs it one track per patrol.
export const selectPatrolMeasuredSubjectIds = createSelector(
  [selectPatrolTeamAndTrackingOptions, selectPatrolRosterFallbackSubjects, (_, patrol) => patrol],
  (patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects, patrol) => uniq(patrol.patrol_segments
    .filter(hasPatrolSegmentRun)
    .flatMap((patrolSegment) => measuredSubjectsForPatrolSegment(
      patrolSegment,
      getTrackedSubjectsForPatrolSegment(patrolSegment, patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects)
    ).map((subject) => subject.id))),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

// A leg's own track, index aligned with the patrol's legs. Held apart from
// the patrol track: only the views that list legs one by one ever read it.
export const selectPatrolSegmentsTrackData = createSelector(
  [
    selectPatrolTeamAndTrackingOptions,
    selectPatrolRosterFallbackSubjects,
    selectPatrolTrackedSubjectTracks,
    (_, patrol) => patrol,
  ],
  (patrolTeamAndTrackingOptions, patrolRosterFallbackSubjects, patrolTrackedSubjectTracks, patrol) =>
    patrol.patrol_segments.map((patrolSegment) => {
      const startTime = patrolSegment.time_range?.start_time;

      if (!startTime) {
        return null;
      }

      return combineTrackData(getTrackedSubjectsForPatrolSegment(
        patrolSegment,
        patrolTeamAndTrackingOptions,
        patrolRosterFallbackSubjects
      )
        .map((subject) => {
          const subjectTrack = patrolTrackedSubjectTracks[subject.id];

          return subjectTrack
            ? trimTrackDataToPatrolTimeRange(
              subjectTrack,
              startTime,
              effectiveEndTimeForPatrolSegment(patrol, patrolSegment)
            )
            : null;
        })
        .filter(Boolean));
    })
);

// Where each subject a patrol tracks was last seen, so a jump to its location
// has somewhere to go before that subject's own track has been fetched.
const selectPatrolTrackedSubjectPositions = createSelector(
  [selectPatrolTrackedSubjectsWithPatrolSegments, selectSubjectStore],
  (patrolTrackedSubjectsWithPatrolSegments, subjectStore) => patrolTrackedSubjectsWithPatrolSegments
    .reduce((trackedSubjectPositions, trackedSubject) => {
      const coordinates = getSubjectLastPositionCoordinates(
        subjectStore[trackedSubject.subject.id] ?? trackedSubject.subject
      );

      if (coordinates) {
        trackedSubjectPositions[trackedSubject.subject.id] = coordinates;
      }

      return trackedSubjectPositions;
    }, {}),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

export const selectPatrolTrackedSubjects = createSelector(
  [
    selectPatrolTrackedSubjectTracks,
    selectPatrolTrackedSubjectPositions,
    selectPatrolTeamAndTrackingOptions,
    selectPatrolRosterFallbackSubjects,
    (_, patrol) => patrol,
  ],
  (
    patrolTrackedSubjectTracks,
    patrolTrackedSubjectPositions,
    patrolTeamAndTrackingOptions,
    patrolRosterFallbackSubjects,
    patrol
  ) => buildTrackedSubjects(
    patrolTrackedSubjectTracks,
    patrolTrackedSubjectPositions,
    patrolTeamAndTrackingOptions,
    patrolRosterFallbackSubjects,
    patrol,
    patrol.patrol_segments,
    patrol.patrol_segments.at(-1)?.leader?.id ?? null
  )
);

// The subjects every leg of a patrol tracks, index-aligned with its own legs,
// so a list of legs resolves them all in a single pass.
export const selectTrackedSubjectsPerPatrolSegment = createSelector(
  [
    selectPatrolTrackedSubjectTracks,
    selectPatrolTrackedSubjectPositions,
    selectPatrolTeamAndTrackingOptions,
    selectPatrolRosterFallbackSubjects,
    (_, patrol) => patrol,
  ],
  (
    patrolTrackedSubjectTracks,
    patrolTrackedSubjectPositions,
    patrolTeamAndTrackingOptions,
    patrolRosterFallbackSubjects,
    patrol
  ) => patrol
    .patrol_segments.map((patrolSegment) => buildTrackedSubjects(
      patrolTrackedSubjectTracks,
      patrolTrackedSubjectPositions,
      patrolTeamAndTrackingOptions,
      patrolRosterFallbackSubjects,
      patrol,
      [patrolSegment],
      patrolSegment.leader?.id ?? null
    ))
);

// The subjects a leg tracks, with the distance each covered on that leg alone.
export const selectPatrolSegmentTrackedSubjects = createSelector(
  [
    selectPatrolTrackedSubjectTracks,
    selectPatrolTrackedSubjectPositions,
    selectPatrolTeamAndTrackingOptions,
    selectPatrolRosterFallbackSubjects,
    (_, patrol) => patrol,
    (_, __, patrolSegment) => patrolSegment,
  ],
  (
    patrolTrackedSubjectTracks,
    patrolTrackedSubjectPositions,
    patrolTeamAndTrackingOptions,
    patrolRosterFallbackSubjects,
    patrol,
    patrolSegment
  ) => buildTrackedSubjects(
    patrolTrackedSubjectTracks,
    patrolTrackedSubjectPositions,
    patrolTeamAndTrackingOptions,
    patrolRosterFallbackSubjects,
    patrol,
    [patrolSegment],
    patrolSegment.leader?.id ?? null
  )
);

export const selectPatrolLeadersWithLastPosition = createSelector(
  [selectPatrolLeaders, selectSubjectStore],
  (patrolLeaders, subjectStore) => {
    const patrolLeadersWithLastPosition = patrolLeaders.map((patrolLeader) => {
      const patrolLeaderSubject = subjectStore[patrolLeader.id];

      if (!patrolLeader.last_position
        && !patrolLeader.last_position_status
        && patrolLeaderSubject?.last_position
        && patrolLeaderSubject?.last_position_status) {
        return {
          ...patrolLeader,
          last_position: patrolLeaderSubject.last_position,
          last_position_status: patrolLeaderSubject.last_position_status,
        };
      }

      return patrolLeader;
    });

    // A socket update changes the subject store on every position, so the list
    // keeps its identity unless this pass actually filled something in.
    return patrolLeadersWithLastPosition.every(
      (patrolLeader, index) => patrolLeader === patrolLeaders[index]
    ) ? patrolLeaders : patrolLeadersWithLastPosition;
  }
);

export const selectPatrolsFeedMappedFromStore = createSelector(
  [selectPatrolsFeed, selectPatrolStore],
  (patrolsFeed, patrolStore) => {
    // List the patrols from the feed that are defined in the patrol store.
    const patrolsFeedMappedFromStore = [];
    patrolsFeed.forEach((patrolId) => {
      if (patrolStore[patrolId]) {
        patrolsFeedMappedFromStore.push(patrolStore[patrolId]);
      }
    });

    return patrolsFeedMappedFromStore;
  }
);

export const selectPatrolsWithTracks = createSelector(
  [selectPatrolStore, selectVisibleAndPinnedPatrolTracks],
  (patrolStore, visibleAndPinnedPatrolTracks) => {
    // List the patrols with visible and pinned tracks that are defined in the
    // patrol store and that allow track display.
    const patrolsWithTracks = [];
    visibleAndPinnedPatrolTracks.forEach((patrolId) => {
      if (patrolStore[patrolId] && patrolStateAllowsTrackDisplay(patrolStore[patrolId])) {
        patrolsWithTracks.push(patrolStore[patrolId]);
      }
    });

    return patrolsWithTracks;
  }
);

// The start and stop markers of a patrol are drawn alongside its track, so
// this says whether the map holds either of them.
export const selectIsPatrolTrackShown = createSelector(
  [selectPatrolsWithTracks, (_, patrolId) => patrolId],
  (patrolsWithTracks, patrolId) => patrolsWithTracks.some((patrolWithTracks) => patrolWithTracks.id === patrolId)
);

const selectPatrolsWithTracksRosterFallbackSubjects = createSelector(
  [selectPatrolTeamAndTrackingOptions, selectPatrolsWithTracks, selectSubjectStore],
  (patrolTeamAndTrackingOptions, patrolsWithTracks, subjectStore) =>
    buildRosterFallbackSubjects(patrolsWithTracks, patrolTeamAndTrackingOptions, subjectStore),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

// Every subject these patrols track and the window its track has to reach:
// nothing else fetches them once the user navigates away. A subject asks once
// for every leg it is on, since a fetch already under way is reused whole.
export const selectPatrolsWithTracksTrackedSubjectRequests = createSelector(
  [selectPatrolTeamAndTrackingOptions, selectPatrolsWithTracks, selectPatrolsWithTracksRosterFallbackSubjects],
  (patrolTeamAndTrackingOptions, patrolsWithTracks, patrolsWithTracksRosterFallbackSubjects) => {
    const trackedSubjectRequests = new Map();

    patrolsWithTracks.forEach((patrol) => (patrol.patrol_segments ?? []).forEach((patrolSegment) => {
      const since = patrolSegment.time_range?.start_time ?? null;
      const until = patrolSegment.time_range?.end_time ?? null;

      getTrackedSubjectsForPatrolSegment(
        patrolSegment,
        patrolTeamAndTrackingOptions,
        patrolsWithTracksRosterFallbackSubjects
      ).forEach((subject) => {
        const trackedSubjectRequest = trackedSubjectRequests.get(subject.id);

        if (trackedSubjectRequest) {
          trackedSubjectRequest.since = earliestTime(trackedSubjectRequest.since, since);
          trackedSubjectRequest.until = latestTimeOrOpenEnded(trackedSubjectRequest.until, until);
        } else {
          trackedSubjectRequests.set(subject.id, { since, subjectId: subject.id, until });
        }
      });
    }));

    return [...trackedSubjectRequests.values()];
  }
);

// The legend lists what the map draws, so it reads the same per patrol work
// rather than a second copy of it: only the rows holding it are built here.
export const selectPatrolsWithTracksData = createSelector(
  [selectPatrolsWithTracks, (state) => state],
  (patrolsWithTracks, state) => patrolsWithTracks
    .map((patrol) => ({ patrol, ...selectPatrolMapTrackData(state, patrol) })),
  { memoizeOptions: { resultEqualityCheck: arePatrolsTracksDataEqual } }
);

export const selectSubjectTracksWithPatrolTrackShownFlag = createSelector(
  [
    selectPatrolTeamAndTrackingOptions,
    selectPatrolsWithTracks,
    selectPatrolsWithTracksRosterFallbackSubjects,
    selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod,
  ],
  (
    patrolTeamAndTrackingOptions,
    patrolsWithTracks,
    patrolsWithTracksRosterFallbackSubjects,
    subjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod
  ) => {
    const patrolTrackedSubjectIds = new Set(patrolsWithTracks.flatMap((patrol) =>
      (patrol.patrol_segments ?? []).flatMap((patrolSegment) => getTrackedSubjectsForPatrolSegment(
        patrolSegment,
        patrolTeamAndTrackingOptions,
        patrolsWithTracksRosterFallbackSubjects
      ).map((subject) => subject.id))));

    return subjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod.map((subjectTracks) => ({
      ...subjectTracks,
      patrolTrackShown: patrolTrackedSubjectIds.has(subjectTracks.track.features[0].properties.id),
    }));
  }
);
