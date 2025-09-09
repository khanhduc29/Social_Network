require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const connectDB = require('./config/db');


const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON body
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Connect to DB
connectDB();

module.exports = app;
