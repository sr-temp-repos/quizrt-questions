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
        wagner.invoke(db.CategoryDB.find, {
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
        var textToSearch = req.body.checkExist,
            topicObj = req.body.topicObj;
        wagner.invoke(db.CategoryDB.find, {
          query: { name : textToSearch },
          callback: function(err, categoryObj) {
            if(categoryObj.length < 1) { // Category not found - return a object with new category name filled for conformation.
              topicObj = { name: topicObj, category: textToSearch };
              res.json({status: 'failure', message: 'Failure : Not Found ' + textToSearch + ' category', topicObj: topicObj });
            } else { // Category found - create a topic with existing category
              wagner.invoke(db.TopicDB.getCount,{
                callback: function(err, doc) {
                  var newTopicId = 'T' + (doc+1),
                      obj = {
                        _id: newTopicId,
                        name: topicObj,
                        imageUrl: "",
                        category: categoryObj[0]._id
                      };
                  console.log(obj);
                  wagner.invoke(db.TopicDB.addTopic,{
                    topicObj: obj,
                    callback: function(err){
                      if(err){
                        topicObj = { name: topicObj, category: textToSearch };
                        res.json({status: 'failure', message: 'Failure : Not Found ' + textToSearch + ' category', topicObj: topicObj });
                      }
                      obj.category = categoryObj[0].name;
                      res.json({status: 'success', message: 'Success : Added ' + obj.name + ' topic', topicObj: obj});
                    }
                  });
                }
              });
            }
          }
        });
        break;

      case 'addTopicCategory':
      // get the count of category and generate new category id
      // add the new category
      // get the topic count and add it with category id
        var topicObj = req.body.topicObj;
        console.log(topicObj);
        wagner.invoke(db.CategoryDB.getCount,{
          callback: function(err, doc) {
            var newCategoryId = 'C' + (doc+1),
                obj = {
                  _id: newCategoryId,
                  name: topicObj.category,
                  imageUrl: "",
                };
            var categoryObj = obj;
            wagner.invoke(db.CategoryDB.addCategory, {
              categoryObj: categoryObj,
              callback: function(err) {
                if(err){
                  res.json({status: 'failure', message: 'Failure : Not added ' + topicObj.category + ' category', topicObj: topicObj });
                }
                // res.json({status: 'success', message: 'Success : Added ' + topicObj.category + ' category', topicObj: obj});
                wagner.invoke(db.TopicDB.getCount, {
                  callback: function(err, doc) {
                    var newTopicId = 'T' + (doc+1),
                        obj = {
                          _id: newTopicId,
                          name: topicObj.name,
                          imageUrl: "",
                          category: categoryObj._id
                        };
                    wagner.invoke(db.TopicDB.addTopic, {
                      topicObj: obj,
                      callback: function(err) {
                        if(err){
                          res.json({status: 'failure', message: 'Failure : Not added ' + topicObj.name + ' topic', topicObj: topicObj });
                        }
                        obj.category = categoryObj.name;
                        res.json({status: 'success', message: 'Success : Added ' + obj.name + ' topic', topicObj: obj});
                      }
                    });
                  }
                });
              }
            });
          }
        });
        break;
    }
  });
  return router;
}
