//requirements:
//input data using at least 5 types of input controls 
//corresponding to 5 different properties
//Three objects - users, quotes, quote categories
//user email
//user password
//Quote - text
//Originated By - text
//Quote category (checkbox
//Quote priority - number
//IsVisible - true false radio button

//Users should be able to view data for records previously entered
//Users should be able to enter an edit mode for any record
//Edit mode should prepopulate needed data (see old values)
//Upon saving object should have same id but updated info


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/QuoteJar');
var validator = require('express-validator');
var sessions = require('client-sessions');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//use this to change port
//app.set('port', 3001);

//sessions to store user info
app.use(sessions({
  cookieName: 'session',
  secret: 'my_super_secret_string',
  duration: 5 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(validator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Make our db accessible to router
app.use(function(req,res,next){
  req.db = db;
  next();
});

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
