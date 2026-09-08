import { useState, useEffect } from 'react';

const setItem = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

// Anything may already be stored under the key, so a value that will not decode
// is treated as no stored preference rather than throwing on render.
const getItem = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
};

const useLocalStorage = (key, defaultVal) => {
  const [value, setValue] = useState(() => getItem(key) || defaultVal);

  useEffect(() => {
    setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

export default useLocalStorage;