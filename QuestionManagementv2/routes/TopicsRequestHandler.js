var express = require('express'),
    fs = require('fs');

var router = express.Router(),
    topicsJSONFileURL = 'public/javascripts/QuestionsJson/Topics_v1.json';


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

  switch(req.body.requestType) {
    case 'list':
      readJSONFile(topicsJSONFileURL, function(err, json) {
        res.json(json);
      });
      break;
    case 'checkTopic':
      var textToSearch = req.body.checkExist;
      readJSONFile(topicsJSONFileURL, function(err, json) {
        for(var prop in json) {
          if(textToSearch === json[prop + ''].name) {
            res.json({status: 'success', message: 'Success : Found ' + textToSearch + ' topic', topicObj: json[prop+'']});
            return;
          }
        }
        res.json({status: 'failure', message: 'Failure : Not Found ' + textToSearch + ' topic'});
      });
      break;
    case 'checkCategory':
      var textToSearch = req.body.checkExist;
      readJSONFile(topicsJSONFileURL, function(err, json) {
        var newTopicId = 'T' + (Object.keys(json).length+1);
        json[newTopicId] = {topicId: newTopicId, name: req.body.newTopicName};
        for(var prop in json) {
          if(textToSearch === json[prop + ''].category) {
            //updating values
            json[newTopicId]['category'] = json[prop+''].category;
            res.json({status: 'success', message: 'Success : Found ' + textToSearch + ' topic', topicObj: json[newTopicId]});
            return;
          }
        }
        //New Category to be added
        json[newTopicId]['category'] = textToSearch;
        res.json({status: 'failure', message: 'Failure : Not Found ' + textToSearch + ' topic', topicObj: json[newTopicId]});
      });
      break;
    case 'addTopicCategory':
      var newTopicObj = {
        topicId: req.body['newTopicObj[topicId]'],
        name: req.body['newTopicObj[name]'],
        category: req.body['newTopicObj[category]']
      };
      res.json({status: 'success', message: 'Success : Added New Topic ' + newTopicObj.topicId + ' topic', topicObj: newTopicObj });
      break;
  }
});

module.exports = router;
