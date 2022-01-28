import Firestore from '@google-cloud/firestore';
// import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import configureEnv from '../constants.js';
configureEnv();

const USER_PREF_DB_COLLECTION_KEY = 'user-preferences';

const { PROJECT_ID, /* SERVICE_ACCOUNT_PRIVATE_KEY_NAME */ } = process.env;

// const keySecretPath = `projects/${PROJECT_ID}/secrets/${SERVICE_ACCOUNT_PRIVATE_KEY_NAME}/versions/1`;

// const secretsClient = new SecretManagerServiceClient();

// const accessSecretVersion = async () => {
//   const [version] = await secretsClient.accessSecretVersion({
//     name: keySecretPath,
//   });

//   const payload = version.payload.data;

//   return JSON.parse(payload).private_key;
// };

// let privateKey = await accessSecretVersion();

// console.log({ privateKey });

const firestoreDb = new Firestore({
  projectId: PROJECT_ID,
});

export const preferencesService = {
  async getUserPreferencesById(userId) {
    const firestoreUserPrefDocRef = await firestoreDb.collection(USER_PREF_DB_COLLECTION_KEY).doc(userId);

    const userPrefDocValue = await firestoreUserPrefDocRef.get();

    if (userPrefDocValue.exists) return userPrefDocValue.data();

    const emptyRecord = { id: userId, preferences: {} };
    await firestoreUserPrefDocRef.set(emptyRecord);

    return emptyRecord;
  },
  async setUserPreference(userId, preferences) {
    const firestoreUserPrefDocRef = await firestoreDb.collection(USER_PREF_DB_COLLECTION_KEY).doc(userId);

    await firestoreUserPrefDocRef.set({ id: userId, preferences }, { merge: true });

    const updatedValue = await firestoreUserPrefDocRef.get();

    return updatedValue.data();
  },
};