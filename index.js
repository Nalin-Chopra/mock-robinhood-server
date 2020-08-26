const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const limiter = rateLimit({
  windowMs: 1 * 15 * 1000, // 15 seconds
  max: 30 // requests during window
});

const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 75, // allow 75 requests per minute, then...
  delayMs: 500 // begin adding 500ms of delay per request above 75:
  // request # 76 is delayed by  500ms
  // request # 77 is delayed by 1000ms
  // request # 78 is delayed by 1500ms
  // etc.
});

const API_URL = 'https://mock-robinhood-simdaq-335gunnhh.vercel.app/simdaq-stocks';

const app = express();
app.set('trust proxy', 1);
app.use(cors()); // special header that allows frontend to talk to backend

let cachedStocks;
let lastComputeTime;
const CACHE_WINDOW = 1 * 1000; // 1 second

const getStocks = () => 
    fetch(API_URL)
        .then(response => response.json());

app.get('/stocks', limiter, speedLimiter, async (req, res, next) => {

    if (lastComputeTime && lastComputeTime > Date.now() - CACHE_WINDOW) {
      return res.json(cachedStocks);
    }

    try {

      let companies = await getStocks();
      cachedStocks = companies;
      lastComputeTime = Date.now();
      return res.json(companies);

    } catch (error) {

      return next(error);
    }
    
});

function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found');
  next(error);
}

function errorHandler(error, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: error.message
  });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Using port', port);
});