import React, { useEffect, useRef } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { Route, Routes, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrol } from '../../../ducks/patrols';
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

  const fetchedPatrolIdRef = useRef(null);

  // Every leg route reads the patrol types, to show or to prefill the type of
  // a leg.
  const isPatrolDataReady = !!patrol && patrolTypes.length > 0;

  useEffect(() => {
    if (patrolId && fetchedPatrolIdRef.current !== patrolId) {
      fetchedPatrolIdRef.current = patrolId;

      dispatch(fetchPatrol(patrolId))
        .catch(() => navigate(`/${TAB_KEYS.PATROLS}`, { replace: true }));
    }
  }, [dispatch, navigate, patrolId]);

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
