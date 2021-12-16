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
      console.log('EMPTY');
      preferenceCollection.insertOne(emptyRecord);
      return emptyRecord.preferences;
    } else {
      console.log('NOT EMPTY');
      return userPrefRecord.preferences;
    }
  }
};