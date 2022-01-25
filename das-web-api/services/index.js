import Firestore from '@google-cloud/firestore';
import { GOOGLE_APPLICATION_CREDENTIALS, PROJECT_ID } from '../constants.js';

const USER_PREF_COLLECTION_KEY = 'user-preferences';

const firestoreDb = new Firestore({
  projectId: PROJECT_ID,
  keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});


export const preferencesService = {
  async getUserPreferencesById(userId) {
    const firestoreUserPrefDocRef = await firestoreDb.collection(USER_PREF_COLLECTION_KEY).doc(userId);
    const userPrefDocValue = await firestoreUserPrefDocRef.get();

    if (userPrefDocValue.exists) return userPrefDocValue.data();

    const emptyRecord = { id: userId, preferences: {} };
    await firestoreUserPrefDocRef.set(emptyRecord);

    return emptyRecord;
  },
  async setUserPreference(userId, preferences) {
    const firestoreUserPrefDocRef = await firestoreDb.collection(USER_PREF_COLLECTION_KEY).doc(userId);
    await firestoreUserPrefDocRef.set({ preferences }, { merge: true });

    const updatedValue = await firestoreUserPrefDocRef.get();

    return updatedValue;
  },
};