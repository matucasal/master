const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require('./configuration/database'); // Mongoose Config 
const path = require('path');
const logger = require('./configuration/logger')(__filename);
const redis = require("redis");
const redisClient = redis.createClient();
const redisController = require('./controllers/redisController');


const { use } = require('chai');

mongoose.Promise = global.Promise;
if (process.env.NODE_ENV === 'test') {
  mongoose.connect(config.uri, config.options);
  logger.info("Mongodb connection succesfully");
} else {
  mongoose.connect(config.uri, config.options);
  logger.info("Mongodb connection succesfully");
}

redisClient.on('connect', function () {
  logger.info('Conectado a Redis Server');
  redisController.setClient(redisClient);
});

const app = express();

// Middlewares moved morgan into if for clear tests
if (!process.env.NODE_ENV === 'test') {
  app.use(morgan('dev'));
}

app.use(bodyParser.json());
//app.use(express.static(__dirname + '/client/front/dist/front')); // Provide static directory for frontend
app.use(express.static(__dirname + '/resources/images/avatars'));

// Connect server to Angular 2 Index.html
app.get('/', (req, res) => {
  console.log(req.header('x-forwarded-for') || req.connection.remoteAddress);
  res.sendFile(path.join(__dirname + '/client/front/dist/front/index.html'));
});


// Routes
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));
app.use('/questions', require('./routes/questions'));

module.exports = app;

/*prueba*/