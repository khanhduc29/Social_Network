require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const connectDB = require('./config/db');
const cookieParser = require("cookie-parser");


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // địa chỉ frontend (React/Vite)
    credentials: true,
  })
);
// Middleware
app.use(express.json()); // parse JSON body
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Connect to DB
connectDB();

module.exports = app;
