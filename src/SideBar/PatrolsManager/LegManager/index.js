import React, { useEffect, useRef, useState } from 'react';
import { isCancel } from 'axios';
import { Route, Routes, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrol, fetchPatrolTeamAndTrackingOptions } from '../../../ducks/patrols';
import { fetchPatrolTypes } from '../../../ducks/patrol-types';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';

import DetailViewLoader from '../DetailViewLoader';
import EditLeg from './EditLeg';
import LegOverview from './LegOverview';
import NewLeg from './NewLeg';

const LegManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { patrolId } = useParams();

  const patrol = useSelector((state) => state.data.patrolStore[patrolId]);
  const patrolTeamAndTrackingOptions = useSelector((state) => state.data.patrolTeamAndTrackingOptions);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const requestedPatrolIdRef = useRef(null);

  const [hasFetchedPatrolData, setHasFetchedPatrolData] = useState(false);

  const isPatrolDataReady = hasFetchedPatrolData
    && !!patrol
    && patrolTeamAndTrackingOptions.hasFetched
    && patrolTypes.length > 0;

  useEffect(() => {
    if (patrolId && requestedPatrolIdRef.current !== patrolId) {
      requestedPatrolIdRef.current = patrolId;

      Promise.all([
        dispatch(fetchPatrol(patrolId)),
        patrolTeamAndTrackingOptions.hasFetched ? null : dispatch(fetchPatrolTeamAndTrackingOptions()),
        patrolTypes.length === 0 ? dispatch(fetchPatrolTypes()) : null,
      ])
        .then(() => setHasFetchedPatrolData(true))
        .catch((error) => {
          // A cancelled request means the session is being torn down, and the
          // redirect that is already under way is the one that stands.
          if (!isCancel(error)) {
            navigate(`/${TAB_KEYS.PATROLS}`, { replace: true });
          }
        });
    }
  }, [dispatch, navigate, patrolId, patrolTeamAndTrackingOptions.hasFetched, patrolTypes.length]);

  useEffect(() => {
    // There is no leg to show without the patrol it belongs to, and none to
    // give a type to on a site serving none.
    if (hasFetchedPatrolData && (!patrol || patrolTypes.length === 0)) {
      navigate(`/${TAB_KEYS.PATROLS}`, { replace: true });
    }
  }, [hasFetchedPatrolData, navigate, patrol, patrolTypes.length]);

  return isPatrolDataReady
    ? <Routes>
      <Route element={<NewLeg patrol={patrol} />} path="new" />

      <Route path=":legId">
        <Route element={<LegOverview patrol={patrol} />} index />

        <Route element={<EditLeg patrol={patrol} />} path="edit" />
      </Route>
    </Routes>
    : <DetailViewLoader />;
};

export default LegManager;
