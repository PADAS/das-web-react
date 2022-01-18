// actions
const SHOW_DRAWER = 'SHOW_DRAWER';
const HIDE_DRAWER = 'HIDE_DRAWER';

//action creators
export const showDrawer = (drawerId, data, direction = 'right') => (dispatch) => dispatch({
  type: SHOW_DRAWER,
  payload: { drawerId, data, direction },
});

export const hideDrawer = () => (dispatch) => dispatch({ type: HIDE_DRAWER, payload: {} });

//reducer
const INITIAL_STATE = { data: null, drawerId: null, direction: 'right', isOpen: false };

export default (state = INITIAL_STATE, action = {}) => {
  switch (action.type) {
  case SHOW_DRAWER:
    return { ...action.payload, isOpen: true };

  case HIDE_DRAWER:
    return { ...INITIAL_STATE, direction: state.direction };

  default:
    return state;
  }
};
