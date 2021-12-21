import { MongoClient } from 'mongodb';

const dbUrl = 'mongodb://pref_db';

export const preferencesService = {
  async getUserPreferencesById(userId) {
    const client = await MongoClient.connect(dbUrl);

    const database = client.db('web-client-db');
    const preferenceCollection = database.collection('user-preferences');

    const userPrefRecord = await preferenceCollection.findOne( { id: { $eq: userId } } );

    const emptyRecord = { id: userId, preferences: {} };

    if (!userPrefRecord) {
      preferenceCollection.insertOne(emptyRecord);

      return emptyRecord.preferences;
    } else {

      return userPrefRecord.preferences;
    }
  },
  async setUserPreference(userId, preferences) {
    const client = await MongoClient.connect(dbUrl);

    const database = client.db('web-client-db');
    const preferenceCollection = database.collection('user-preferences');

    const filter = { id: { $eq: userId } };
    const updateDoc = {
      $set: {
        preferences,
      }
    };
    const options = { upsert: true };

    await preferenceCollection.updateOne(filter, updateDoc, options);

    return { id: userId, preferences };
  }
};