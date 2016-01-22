var express = require('express'),
    fs = require('fs');

var router = express.Router(),
    questionJSONFileURL = 'public/javascripts/QuestionsJson/QuestionSample_3.json';

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
    case 'list':
      readJSONFile(questionJSONFileURL, function(err, json) {
        res.json(json);
      });
      break;
    case 'search':
      readJSONFile(questionJSONFileURL, function(err, json) {
        var query = req.body.query,
            searchKeywords = new RegExp('\\b(' + query.replace(/\s/g,'|') + ')','ig'),
            json = json.filter(function(result) {
              return result.question.search(searchKeywords) > -1 || result.topicId.search(searchKeywords) > -1 || result.categories.search(searchKeywords) > -1;
            });
        res.json(json);
      });
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
module.exports = router;
