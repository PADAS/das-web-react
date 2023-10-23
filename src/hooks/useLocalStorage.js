import { useState, useEffect } from 'react';

const setItem = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getItem = (key) =>
  JSON.parse(
    window.localStorage.getItem(key)
  );

const useLocalStorage = (key, defaultVal) => {
  const [value, setValue] = useState(() => getItem(key) || defaultVal);

  useEffect(() => {
    setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

export default useLocalStorage;