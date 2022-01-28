import express from 'express';
import http from 'http';

// import configureEnv from './constants.js';
import configMiddleware from './middleware.js';
import configRoutes from './routes.js';

const { PORT } = process.env;
const app = express();
const server = http.createServer(app);

configMiddleware(app);
configRoutes(app);

console.log('listening on port', PORT);

server.listen(PORT);
