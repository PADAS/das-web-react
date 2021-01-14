export const undo = (namespace) => ({
  type: `UNDO_${namespace}`,
});

export const redo = (namespace) => ({
  type: `REDO_${namespace}`,
});

export const calcInitialUndoableState = (reducer) => ({
  past: [],
  current: reducer(undefined, {}),
  future: []
});

const undoableReducer = (reducer, namespace) => {
  const initialState = calcInitialUndoableState(reducer);

  return (state = initialState, action) => {
    const { past, current, future } = state;


    if (action.type ===  `UNDO_${namespace}`) {
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        current: previous,
        future: [current, ...future]
      };
    }

    if (action.type === `REDO_${namespace}`) {
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, current],
        current: next,
        future: newFuture
      };
    }

    const newPresent = reducer(current, action);

    if (current === newPresent) {
      return state;
    }

    return {
      past: [...past, current],
      current: newPresent,
      future: []
    };
  };
};

export default undoableReducer;