const express = require("express");
const env = require('dotenv').config();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const cookieParser = require("cookie-parser");
const session = require("express-session");


// Import Database Model
require("./utils/db");

const app = express();
// const port = process.env.PORT || 5000;

app.use(methodOverride("_method"));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
});

app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb+srv://fachridp:panasonic003@alfas-makassar.9sbnw.mongodb.net/newALFAS?retryWrites=true&w=majority",
  })
}));

// Setup EJS
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const index = require('./routes/index');
app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('Server is started on http://127.0.0.1:'+PORT);
});
