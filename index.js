const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:2000/simdaq-stocks';

require('dotenv').config();

const app = express();

app.use(morgan('tiny'));
app.use(cors()); // special header that allows frontend to talk to backend

const getStocks = () => 
    fetch(API_URL)
        .then(response => response.json());

app.get('/stocks', async (req, res) => {
    companies = await getStocks();
    res.json(companies);
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
  console.log('Listening on port', port);
});