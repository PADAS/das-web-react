const express = require('express');

const apiV1 = require('./api/v1.0');
const apiV2 = require('./api/v2.0');

const HOST = '0.0.0.0';
const PORT = 8080;

const app = express();

app.use('/api/v1.0', apiV1);
app.use('/api/v2.0', apiV2);

app.listen(PORT, HOST, () => {
  console.log(`Mock API listening on ${HOST}:${PORT}`);
});
