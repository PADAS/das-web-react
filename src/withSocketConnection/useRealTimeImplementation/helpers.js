import store from '../../store';
import { newSocketActivity, resetSocketActivityState } from '../../ducks/realtime';

export const updateSocketStateTrackerForEventType = ({ type, mid = 0, timestamp = new Date().toISOString() }) => {
  store.dispatch(
    newSocketActivity({ type, mid, timestamp })
  );
};

export const resetSocketStateTracking = () => store.dispatch(resetSocketActivityState());

export const validateSocketIncrement = (type, mid) => {
  if (type === 'echo_resp') return true;
  const updates = store.getState().data.socketUpdates[type];
  if (!updates) return true;
  return updates.mid + 1 === mid;
};
