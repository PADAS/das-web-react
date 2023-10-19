import globallyResettableReducer, { resetGlobalState } from './global-resettable';

describe('globallyResettableReducer', () => {
  const initialState = { count: 0 };

  const reducer = (state, action) => {
    switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
    }
  };

  test('should reset the state to the initial state when the reset action is dispatched', () => {
    const resettableReducer = globallyResettableReducer(reducer, initialState);

    const state1 = resettableReducer({ count: 1 }, { type: 'INCREMENT' });
    expect(state1).toEqual({ count: 2 });

    const state2 = resettableReducer(state1, { type: resetGlobalState().type });
    expect(state2).toEqual(initialState);
  });

  test('should pass through other actions to the wrapped reducer', () => {
    const resettableReducer = globallyResettableReducer(reducer, initialState);

    const state1 = resettableReducer(undefined, { type: 'INCREMENT' });
    expect(state1).toEqual({ count: 1 });

    const state2 = resettableReducer(state1, { type: 'DECREMENT' });
    expect(state2).toEqual({ count: 0 });
  });
});