var express = require('express'),
    fs = require('fs'),
    db = require('./DB')

var router = express.Router(),
    topicsJSONFileURL = 'public/javascripts/QuestionsJson/Topics_v1.json';

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

    switch(req.body.requestType) {
      case 'listTopics':
        wagner.invoke(db.TopicDB.list, {
          callback : function(err, json) {
            res.json(json);
          }
        });
        break;
      case 'listCategories':
        wagner.invoke(db.CategoryDB.list, {
          callback: function(err, doc) {
            res.json(doc);
          }
        });
        break;
      case 'checkTopic':
        var textToSearch = req.body.checkExist;
        wagner.invoke(db.TopicDB.findTopic, {
          query: { name : textToSearch },
          callback: function(err, doc) {
            if(doc) {
              res.json({status: 'success', message: 'Success : Found ' + textToSearch + ' topic', topicObj: doc[0]});
              return;
            }
            else {
              res.json({status: 'failure', message: 'Failure : Not Found ' + textToSearch + ' topic'});
            }
          }
        })
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
  return router;
}
