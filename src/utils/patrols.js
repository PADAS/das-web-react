// XXX remove this after we get a stable api
const patrolItemStatusTable = {
  'upcoming': 'status-ready',
  'active': 'status-active',
  'checkin-past': 'status-start-overdue',
  'cancelled': 'status-done',
  'past': 'status-start-overdue'
};

export const calcPatrolStatusStyle = (patrolState) => {
  return patrolItemStatusTable[patrolState] || 'status-ready';
};


