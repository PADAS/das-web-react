
import { useEffect, useState } from 'react';
import { createMigrate, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const RESTORABLE_PREFIX = 'er-web-restorable';

const setKeyIsRestorable = (key, restore = false) => {
  localStorage.setItem(`${RESTORABLE_PREFIX}:${key}`, JSON.stringify({ restore }));
};

const getKeyIsRestorable = (key) =>
  JSON.parse(
    localStorage.getItem(`${RESTORABLE_PREFIX}:${key}`)
  )?.restore;

export const clearAllRestorables = () => {
  Object.keys(localStorage)
    .filter(key =>
      key.startsWith(`${RESTORABLE_PREFIX}:`)
    )
    .forEach(key =>
      localStorage.removeItem(key)
    );
};

export const generateStorageConfig = (key, storageMethod = storage, version = -1, migrations) => {
  const config = { key, storage: storageMethod, version };

  if (migrations) {
    config.migrate = createMigrate(migrations);
  }

  return config;

};

export const generateOptionalStorageConfig = (namespace, INITIAL_STATE) => {
  const storageConfig = generateStorageConfig(namespace);
  const shouldRestore = getKeyIsRestorable(namespace);

  console.log({ [namespace]: shouldRestore });

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
  const [restorable, setRestorable] = useState(getKeyIsRestorable(key));

  useEffect(() => {
    setKeyIsRestorable(key, restorable);
  }, [key, restorable]);


  return { restorable, setRestorable };

};
