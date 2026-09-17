import React, { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { fetchTracksIfNecessary } from '../utils/tracks';
import { selectPatrolsWithTracks, selectPatrolsWithTracksTrackedSubjectRequests } from '../selectors/patrols';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const patrolsWithTracks = useSelector(selectPatrolsWithTracks);
  const patrolsWithTracksTrackedSubjectRequests = useSelector(selectPatrolsWithTracksTrackedSubjectRequests);

  useEffect(() => {
    patrolsWithTracksTrackedSubjectRequests.forEach((trackedSubjectRequest) => {
      fetchTracksIfNecessary([trackedSubjectRequest.subjectId], {
        optionalDateBoundaries: { since: trackedSubjectRequest.since, until: trackedSubjectRequest.until },
      });
    });
  }, [patrolsWithTracksTrackedSubjectRequests]);

  return patrolsWithTracks.map((patrol) => <PatrolTrackLayer key={patrol.id} patrol={patrol} {...props} />);
};

export default memo(PatrolTracks);
