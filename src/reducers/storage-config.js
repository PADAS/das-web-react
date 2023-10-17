import { createMigrate, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const RESTORABLE_PREFIX = 'er-web-restorable';

export const setKeyIsRestorable = (key, restore = false) => {
  localStorage.setItem(`${RESTORABLE_PREFIX}:${key}`, { restore });
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

export const generateOptionalStorageConfig = (key, INITIAL_STATE) => {
  const storageConfig = generateStorageConfig(key);
  const shouldRestore = getKeyIsRestorable(key);

  const transform = createTransform(
    (inboundState, key) => {
      if (!shouldRestore) return INITIAL_STATE[key];
      return inboundState;
    }
  );

  storageConfig.transforms = [transform];

  return storageConfig;
};
