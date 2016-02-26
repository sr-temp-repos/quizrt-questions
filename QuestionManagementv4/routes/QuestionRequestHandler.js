var express = require('express'),
    db = require('./DB'),
    fs = require('fs');

var router = express.Router();

module.exports = function(wagner) {

  router.post('/', function(req, res, next) {
    console.log(req.body);
    switch(req.body.requestType){
      case 'add':
        wagner.invoke(db.QuestionDB.add, {
          callback: function(err, count, ins, notIns) {
            if(err)
              res.json({status: 'failure', message: 'Failure : Cannot able to save  in the question data store.'});
            else
              res.json({status: 'success', message: 'Success : Saved in the question data store.', count: count, inserted: ins, notInserted: notIns});
          }
        });
        break;
      case 'search':
        var query = req.body.query,
            sortType = req.body.sortType,
            sortReverse = req.body.sortReverse,
            searchIn = req.body.searchIn,
            obj = {},
            rgexQuery = query !=""? new RegExp('\\b(' + query.replace(/\s/g,'|') + ')','ig'): "";

        sortReverse = (sortReverse)? 1: -1;
        if(sortType!="") {
          obj[sortType] = sortReverse;
        }
        wagner.invoke(db.QuestionDB.find, {
          searchSettings : {
            query: rgexQuery,
            sortObj: obj,
            firstQuestion: req.body.firstQuestion,
            count: req.body.count,
            searchIn: searchIn,
            wagner: wagner,
            db: db
          },
          callback: function(err, json) {
            res.json(json);
          }
        });
        break;
      case 'save':
        /* Data base area for edit operations */
        var question = req.body.question;
        wagner.invoke(db.QuestionDB.save, {
          question: question,
          callback: function(err, doc) {
            if (doc) {
              res.json({status: 'success', message: 'Success : Saved in the question data store.'});
            } else {
              res.json({status: 'failure', message: 'Failure : Cannot able to save in the question data store.'});
            }
          }
        });
        break;
      case 'delete':
        var id = req.body.questionId;
        // console.log(id);
        wagner.invoke(db.QuestionDB.delete,{
          id: id,
          callback: function(err, doc) {
            if (doc) {
              res.json({status: 'success', message: 'Success : Deleted ' + id + ' from the question data store.'});
            } else {
              res.json({status: 'failure', message: 'Failure : Cannot able to delete ' + id + ' in the question data store.'});
            }
          }
        });
        break;
      case 'deleteSelected':
        /*
          1. Convert post data to local variable
          2. delete based on ids
          3. delete based on query
        */
        var deleteIds = req.body.deleteIds,
            query = req.body.query? req.body.query: "",
            searchIn = req.body.searchIn,
            rgexQuery = query !=""? new RegExp('\\b(' + query.replace(/\s/g,'|') + ')','ig'): "";
        console.log(deleteIds);
        if(deleteIds.length > 0) {
          wagner.invoke(db.QuestionDB.deleteByIds, {
            deleteIds: deleteIds,
            callback: function(err, doc) {
              if (doc) {
                res.json({status: 'success', message: 'Success : Deleted all selected ids from the question data store.'});
              } else {
                res.json({status: 'failure', message: 'Failure : Cannot able to delete in the question data store.'});
              }
            }
          });
        } else {
          wagner.invoke(db.QuestionDB.deleteByQuery, {
            searchSettings: {
              query: rgexQuery,
              searchIn: searchIn,
              wagner: wagner,
              db: db
            },
            callback: function(err, doc) {
              if (doc) {
                res.json({status: 'success', message: 'Success : Deleted all selected ids from the question data store.'});
              } else {
                res.json({status: 'failure', message: 'Failure : Cannot able to delete in the question data store.'});
              }
            }
          });
        }
        break;
    }

  });
  return router;
}
