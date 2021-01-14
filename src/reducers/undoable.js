export const undo = (namespace) => ({
  type: `UNDO_${namespace}`,
});

export const redo = (namespace) => ({
  type: `REDO_${namespace}`,
});

const undoableReducer = (reducer, namespace) => {
  const initialState = {
    past: [],
    present: reducer(undefined, {}),
    future: []
  };

  return (state = initialState, action) => {
    const { past, present, future } = state;


    if (action.type ===  `UNDO_${namespace}`) {
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future]
      };
    }

    if (action.type === `REDO_${namespace}`) {
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture
      };
    }

    const newPresent = reducer(present, action);

    if (present === newPresent) {
      return state;
    }

    return {
      past: [...past, present],
      present: newPresent,
      future: []
    };
  };
};

export default undoableReducer;