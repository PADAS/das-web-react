import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import https from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';

const { parsed: ENV } = dotenv.config({ path: '.env' });

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const API_URL = `${ENV.DAS_HOST}${ENV.DAS_API_URL}`;

const app = express();
const server = http.createServer(app);

const numberIsEven = (num) => !(num % 2);

const buildAxiosHeadersObjectFromRawReqHeaders = (rawHeaders) =>
  rawHeaders.reduce((accumulator, item, index, array) => {
    if (!numberIsEven(index)) return {
      ...accumulator,
      [array[index -1]]: item,
    };
    return accumulator;
  }, {});

app.get(`/${ENV.APP_PREFIX}/preferences/:userId`, async (req, res, next) => {
  console.log('i am this far');

  const headers = buildAxiosHeadersObjectFromRawReqHeaders(req.rawHeaders);
  headers['Host'] = 'http://localhost:9000/';

  console.log('headers built', headers);

  const USER_API_URL = `${API_URL}/user/me`;

  await axiosInstance.get(USER_API_URL, { headers })
    .then((res) => {
      res.status(200).send(res);
    })
    .catch((error) => {
      console.warn({ error });
      next(error);
    });
  next();
});

// app.use(`/${ENV.APP_PREFIX}`,
//   createProxyMiddleware({
//     target: API_URL,
//     changeOrigin: true,
//     pathRewrite: {
//       [`^/${ENV.APP_PREFIX}`]: '',
//     },
//     onProxyReq(req,) {

//     },
//   }));

server.listen(ENV.PORT);
