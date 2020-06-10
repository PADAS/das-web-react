const GLOBAL_STORE_RESET = 'GLOBAL_STORE_RESET';

export const resetGlobalState = () => ({
  type: GLOBAL_STORE_RESET,
});

const globallyResettableReducer = (reducer, initialState) => {
  return (state, action) => {
    const { type } = action;
    if (type === GLOBAL_STORE_RESET) {
      return initialState;
    }
    return reducer((state || initialState), action);
  };
};

export default globallyResettableReducer;