import { uuid } from '../utils/string';

const ADD_USER_NOTIFICATION = 'ADD_USER_NOTIFICATION';
const REMOVE_USER_NOTIFICATION = 'REMOVE_USER_NOTIFICATION';

export const addUserNotification = (notification) => ({
  type: ADD_USER_NOTIFICATION,
  payload: {
    id: uuid(),
    ...notification,
  },
});

export const removeUserNotification = (id) => ({
  type: REMOVE_USER_NOTIFICATION,
  payload: id,
});


const userNotificationReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === ADD_USER_NOTIFICATION) return [...state, payload];
  if (type === REMOVE_USER_NOTIFICATION) return state.filter(({ id }) => id !== payload);
  return state;
};

export default userNotificationReducer;