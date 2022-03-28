import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

import { fetchTrackedBySchema } from '../../ducks/trackedby';
import LoadingOverlay from '../../LoadingOverlay';
import ReportedBySelect from '../../ReportedBySelect';
import { trackEventFactory, PATROL_MODAL_CATEGORY } from '../../utils/analytics';
import { subjectIsARadio, radioHasRecentActivity } from '../../utils/subjects';


import styles from './styles.module.scss';

const patrolModalTracker = trackEventFactory(PATROL_MODAL_CATEGORY);

const PlanTab = ({ patrolForm, onPatrolChange, patrolLeaderSchema, fetchTrackedBySchema }) => {

  const [loadingTrackedBy, setLoadingTrackedBy] = useState(true);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)){
      fetchTrackedBySchema()
        .finally(() => setLoadingTrackedBy(false));
    } else {
      setLoadingTrackedBy(false);
    }
  }, [fetchTrackedBySchema, patrolLeaderSchema]);

  const patrolLeaders = patrolLeaderSchema?.trackedbySchema ? patrolLeaderSchema.trackedbySchema?.properties?.leader?.enum_ext?.map(({ value }) => value): [];

  const displayTrackingSubject = useMemo(() => patrolForm.patrol_segments?.[0]?.leader || null, [patrolForm.patrol_segments]);
  const onSelectTrackedSubject = useCallback((value) => {
    const patrolIsNew = !patrolForm.id;

    patrolModalTracker.track(`${value ? 'Set' : 'Unset'} patrol tracked subject`);

    const update = {
      patrol_segments: [
        {
          leader: value || null,
        },
      ],
    };

    if (patrolIsNew) {
      const trackedSubjectLocation = value?.last_position?.geometry?.coordinates;
      const trackedSubjectLocationTime = value?.last_position?.properties?.coordinateProperties?.time;

      if (radioHasRecentActivity(value)
        && subjectIsARadio(value)
        && !!trackedSubjectLocation
        && !!trackedSubjectLocationTime) {

        update.patrol_segments[0].start_location = {
          latitude: trackedSubjectLocation[1],
          longitude: trackedSubjectLocation[0],
        };

        update.patrol_segments[0].time_range = {
          start_time: trackedSubjectLocationTime,
        };
      } else if (!value) {
        update.patrol_segments[0].start_location = null;
        update.patrol_segments[0].time_range = {
          start_time: new Date().toISOString(),
        };
      }
    }

    onPatrolChange(merge({}, patrolForm, update));
  }, [patrolForm, onPatrolChange]);

  return <>
    <label data-testid="reported-by-select" className={`${styles.trackedByLabel} ${loadingTrackedBy ? styles.loading : ''}`}>
      {loadingTrackedBy && <LoadingOverlay className={styles.loadingTrackedBy} message={''} />}
      Tracked By
      <ReportedBySelect className={styles.reportedBySelect} placeholder='Select Device...' value={displayTrackingSubject} onChange={onSelectTrackedSubject} options={patrolLeaders} />
    </label>
  </>;
};

const mapStateToProps = ({ data: { patrolLeaderSchema } }) => ({
  patrolLeaderSchema
});

export default connect(mapStateToProps, { fetchTrackedBySchema })(PlanTab);
