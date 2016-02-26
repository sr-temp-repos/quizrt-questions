var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose=require('mongoose');

var routes = require('./routes/index');
var users = require('./routes/users');
var getExclusionList = require('./routes/getExclusionList');
var getHintsForOption = require('./routes/getHintsForOption');
var getHintsForVariable = require('./routes/getHintsForVariable');
var getJsonDataForVariable= require('./routes/getJsonDataForVariable')
var generateQuestions= require('./routes/generateQuestions');
var getTopicsList= require('./routes/getTopicsList');
var saveQuestionPattern= require('./routes/saveQuestionPattern');
var overWriteDupQuesStub= require('./routes/overWriteDupQuesStub');
var getStubsList= require('./routes/getStubsList');
var QuestionRequestHandler= require('./routes/QuestionRequestHandler');
var wagner = require('wagner-core');

var db = require('./routes/DB.js');

db.init(wagner, {
  connectionURL: 'mongodb://172.23.238.253/quizRT3'
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
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/getExclusionList', getExclusionList);
app.use('/getTopicsList', getTopicsList);
app.use('/getHintsForOption', getHintsForOption);
app.use('/getHintsForVariable', getHintsForVariable);
app.use('/getJsonDataForVariable', getJsonDataForVariable);
app.use('/generateQuestions', generateQuestions);
app.use('/saveQuestionPattern', saveQuestionPattern);
app.use('/overWriteDupQuesStub', overWriteDupQuesStub);
app.use('/getStubsList', getStubsList);
app.use('/QuestionRequestHandler', QuestionRequestHandler(wagner));
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

  // var uristring="mongodb://172.23.238.253/quizRT3";
  //
  //  mongoose.connect(uristring, function (err, res) {
  //    if (err) {
  //    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  //    } else {
  //    console.log ('Succeeded connected to: ' + uristring);
  //    }
  //  });
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
