import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';

import { fetchTrackedBySchema } from '../../ducks/trackedby';
import LoadingOverlay from '../../LoadingOverlay';
import ReportedBySelect from '../../ReportedBySelect';

import styles from './styles.module.scss';

const PlanTab = ({ patrolForm, patrolLeaderSchema, fetchTrackedBySchema }) => {

  const [loadingTrackedBy, setLoadingTrackedBy] = useState(true);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)){
      fetchTrackedBySchema()
        .catch(() => {
        //
        })
        .finally(() => setLoadingTrackedBy(false));
    } else {
      setLoadingTrackedBy(false);
    }
  }, [fetchTrackedBySchema, patrolLeaderSchema]);

  const displayTrackingSubject = useMemo(() => {
    if (!patrolForm?.patrol_segments?.length) return null;
    const [firstLeg] = patrolForm.patrol_segments;

    const { leader } = firstLeg;
    if (!leader) return null;
    return leader;
  }, [patrolForm.patrol_segments]);

  const onSelectTrackedSubject = useCallback((value) => {
    console.log('%c onSelectTrackedSubject', 'font-size:20px;color:purple', value);
  }, []);

  const patrolLeaders = patrolLeaderSchema?.trackedbySchema ? patrolLeaderSchema.trackedbySchema?.properties?.leader?.enum_ext?.map(({ value }) => value): [];

  return <>
    <label className={`${styles.trackedByLabel} ${loadingTrackedBy ? styles.loading : ''}`}>
      {loadingTrackedBy && <LoadingOverlay className={styles.loadingTrackedBy} message={''} />}
      Tracking:
      <ReportedBySelect className={styles.reportedBySelect} placeholder='Tracked By...' value={displayTrackingSubject} onChange={onSelectTrackedSubject} options={patrolLeaders} />
    </label>
  </>;
};

const mapStateToProps = ({ data: { patrolLeaderSchema } }) => ({
  patrolLeaderSchema
});

export default connect(mapStateToProps, { fetchTrackedBySchema })(PlanTab);
