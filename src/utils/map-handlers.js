import debounce from 'lodash/debounce';

export const withMultiLayerHandlerAwareness = fn => (event = {}) => {
  const PROP = 'singleLayerSelected';
  const DEBOUNCE_TIME = 50;

  return debounce(() => {
    if (event.hasOwnProperty(PROP) && !event[PROP]) return null;

    return fn(event);
  }, DEBOUNCE_TIME);
};