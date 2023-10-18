
import { useCallback } from 'react';
import { createMigrate, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import useLocalStorage from '../hooks/useLocalStorage';

const RESTORABLE_PREFIX = 'er-web-restorable';

const namespaceForKey = key => `${RESTORABLE_PREFIX}:${key}`;

const getKeyIsRestorable = (key) =>
  JSON.parse(
    window.localStorage.getItem(namespaceForKey(key))
  )?.restore;

export const generateStorageConfig = (key, storageMethod = storage, version = -1, migrations) => {
  const config = { key, storage: storageMethod, version };

  if (migrations) {
    config.migrate = createMigrate(migrations);
  }

  return config;

};

export const generateOptionalStorageConfig = (key, INITIAL_STATE) => {
  const storageConfig = generateStorageConfig(key);
  const shouldRestore = getKeyIsRestorable(key);

  const transform = createTransform(
    inboundState => inboundState,
    (outboundState, key) => {

      if (!shouldRestore) return INITIAL_STATE[key];
      return outboundState;
    }
  );

  storageConfig.transforms = [transform];

  return storageConfig;
};

export const useOptionalPersistence = (key) => {
  const namespace = namespaceForKey(key);

  const [value, setValue] = useLocalStorage(namespace, { restore: false });
  const restorable = value?.restore;

  const setRestorable = useCallback((restore = false) => {
    setValue({ restore });
  }, [setValue]);

  return { restorable, setRestorable };

};
