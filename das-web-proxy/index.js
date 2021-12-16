import express from 'express';
import http from 'http';

import { PORT } from './constants.js';
import configMiddleware from './middleware.js';
import configRoutes from './routes.js';

const app = express();
const server = http.createServer(app);

configMiddleware(app);
configRoutes(app);

console.log('listening on port', PORT);

server.listen(PORT);
