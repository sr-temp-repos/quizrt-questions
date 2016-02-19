var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var wagner = require('wagner-core');


var questionRequestHandler = require('./routes/QuestionRequestHandler');
var topicsRequestHandler = require('./routes/TopicsRequestHandler');

var db = require('./routes/DB.js');

db.init(wagner, {
  connectionURL: 'mongodb://localhost/test',
  collection: [
    'Questions',
    'Topics',
    'Categories'
  ]
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/FilesNoAuth')));


/* Authentication block start here */
// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

var authenticationHandler = require('./routes/Auth')(passport);

app.get('/login', authenticationHandler.getLoginPage);
app.post('/login', authenticationHandler.login(passport));
app.post('/signup', authenticationHandler.signup(passport));
app.get('/signout', authenticationHandler.signout);

// authenticate request
app.use(authenticationHandler.AuthenticateRequest);

/* End of Authentication Block */

// Request authenticated now allowing to normal routes
app.use(express.static(path.join(__dirname, 'public')));

app.use('/QuestionRequestHandler', questionRequestHandler(wagner));
app.use('/TopicsRequestHandler', topicsRequestHandler(wagner));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// console.log('connectionURL');
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
