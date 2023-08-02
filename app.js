const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');

const comprassion = require("compression")
const helmet = require("helmet")

const app = express();

const RateLimit = require("express-rate-limit");
// to set up 20 requests per minute:
const limiter = RateLimit({
  windowsMS: 1*60*1000, //1minute
  max:20
});

app.use(limiter);

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

// Set up mongoose connection
const dev_db_url =
  "mongodb+srv://dominikwie:tn8TWCKIDd7NGWk0@cluster0.tro57ja.mongodb.net/local_library?retryWrites=true&w=majority";
const mongoDB = process.env.MONGODB_URI || dev_db_url;



main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
};


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(comprassion()); //to compress all routes in HTTP

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Add helmet to the middleware chain.
// Set CSP headers to allow our Bootstrap and Jquery to be served
app.use(
  helmet.contentSecurityPolicy({
    directives:{
      "script-src":["'self'", "code.jquery.com", "cdn.jsdelivr.net"]
    },
  }),
);


module.exports = app;
