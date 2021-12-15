import express from 'express';
import http from 'http';
import { PORT } from './constants.js';
import { MongoClient } from 'mongodb';
import { fetchCurrentUserForRequest } from './user/index.js';

try {


  const serviceUrl = 'mongodb://pref-db';


  const app = express();
  const server = http.createServer(app);

  MongoClient.connect(serviceUrl, (err, db) => {
    if (!err) {
      console.log('connected', db);
    }
  });

  app.use('/preferences*', [fetchCurrentUserForRequest]);

  app.get('/preferences/:userId', (req, res) => {
    const userId = res?.userData?.id;

    if (!userId) {
      res.sendStatus(404);
    }

    res.status(200).send(res.userData);
  });

  console.log('listening on port', PORT);

  server.listen(PORT);
} catch (e) {
  console.warn('ERROR ON SERVER', e);
}
