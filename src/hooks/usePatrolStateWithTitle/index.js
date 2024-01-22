import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { calcPatrolState } from '../../utils/patrols';

const getPatrolStateWithTitle = (translate) => (patrol) => {
  const patrolState = calcPatrolState(patrol);
  patrolState.title = translate(patrolState.key);
  return patrolState;
};

const usePatrolStateWithTitle = (patrol) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'uiStateTitles' });
  const calcPatrolStateWithTitle = getPatrolStateWithTitle(t);
  const [patrolState, setPatrolState] = useState(calcPatrolStateWithTitle(patrol));

  useEffect(() => {
    setPatrolState(calcPatrolStateWithTitle(patrol));
  }, [patrol]);

  return { patrolState, setPatrolState };
};

export default usePatrolStateWithTitle;
