import express from 'express';
import http from 'http';
import { PORT } from './constants.js';

import { fetchCurrentUserForRequest } from './user/index.js';

const app = express();
const server = http.createServer(app);

app.use('/preferences*', [fetchCurrentUserForRequest]);

app.get('/preferences/:userId', (req, res) => {
  res.send(res.userData);
});

console.log('listening on port', PORT);

server.listen(PORT);
