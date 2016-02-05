var express = require('express'),
    db = require('./DB'),
    fs = require('fs');

var router = express.Router(),
    questionJSONFileURL = 'public/javascripts/QuestionsJson/QuestionSample_3.json';

module.exports = function(wagner) {

  function readJSONFile(filename, callback) {
    fs.readFile(filename, function (err, data) {
      if(err) {
        callback(err);
        return;
      }
      try {
        callback(null, JSON.parse(data));
      } catch(exception) {
        callback(exception);
      }
    });
  }

  router.post('/', function(req, res, next) {
    switch(req.body.requestType){
      case 'add':
        wagner.invoke(db.QuestionDB.add, {
          json: req.body.questions,
          callback: function(err, json) {

          }
        });
        break;
      case 'list':
        wagner.invoke(db.QuestionDB.getCount, {
          callback : function(err, count) {
            wagner.invoke(db.QuestionDB.find, {
              query: {},
              firstQuestion: req.body.firstQuestion,
              count: req.body.count,
              callback : function(err, json) {
                var jsonData = {
                  rows: json,
                  firstQuestion: req.body.firstQuestion,
                  count: count
                };
                res.json(jsonData);
              }
            });
          }
        });
        // readJSONFile(questionJSONFileURL, function(err, json) {
        //   res.json(json);
        // });
        break;
      case 'search':
        //readJSONFile(questionJSONFileURL, function(err, json) {
        var query = req.body.query,
            rgexQuery = new RegExp('\\b(' + query.replace(/\s/g,'|') + ')','ig');
        wagner.invoke(db.QuestionDB.find, {
          query: { $or : [
              { question :  rgexQuery },
              { topicIds: { $elemMatch: { name: rgexQuery } } },
              { topicIds : { $elemMatch : { 'category.name' : rgexQuery } } }
            ]
          },
          callback : function(err, json) {
            res.json(json);
          }
        });
        break;
      case 'edit':
        /* Data base area for edit operations */
        res.json({status: 'success', message: 'Success : Successfully saved the question'});
        break;
      case 'delete':
        readJSONFile(questionJSONFileURL, function(err, json) {
          var questionIdToDelete = parseInt(req.body.questionId);
          if( json.length > questionIdToDelete && questionIdToDelete > -1 ) {
            res.json({status: 'success', message: 'Success : Deleted ' + questionIdToDelete + ' from the question data store.'});
          } else {
            res.json({status: 'failure', message: 'Failure : Cannot able to find ' + questionIdToDelete + ' in the question data store.'});
          }
        });
    }

  });

  return router;
}
