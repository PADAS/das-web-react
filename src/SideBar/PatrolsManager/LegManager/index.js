import React, { useEffect, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { Route, Routes, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrol } from '../../../ducks/patrols';
import { fetchPatrolTypes } from '../../../ducks/patrol-types';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';

import NewLeg from './NewLeg';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 50;

const LegManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { patrolId } = useParams();

  const patrol = useSelector((state) => state.data.patrolStore[patrolId]);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const requestedPatrolIdRef = useRef(null);

  const [hasFetchedPatrolData, setHasFetchedPatrolData] = useState(false);

  const isPatrolDataReady = hasFetchedPatrolData && !!patrol && patrolTypes.length > 0;

  useEffect(() => {
    if (patrolId && requestedPatrolIdRef.current !== patrolId) {
      requestedPatrolIdRef.current = patrolId;

      Promise.all([
        dispatch(fetchPatrol(patrolId)),
        patrolTypes.length === 0 ? dispatch(fetchPatrolTypes()) : null,
      ])
        .then(() => setHasFetchedPatrolData(true))
        .catch(() => navigate(`/${TAB_KEYS.PATROLS}`, { replace: true }));
    }
  }, [dispatch, navigate, patrolId, patrolTypes.length]);

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

      <Route element={<div>Leg Manager</div>} path=":legId/*" />
    </Routes>
    : <div className={styles.loaderWrapper} data-testid="legManager-loader">
      <MoonLoader size={LOADER_SIZE} />
    </div>;
};

export default LegManager;
