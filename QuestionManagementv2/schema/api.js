var express = require('express');
var status = require('http-status');

module.exports = function(wagner) {
  var api = express.Router();

  api.get('/list', wagner.invoke(function(Question) {
    return function(req, res) {
      Question.find({  }, function(error, question) {
        if (error) {
          return res.
            status(status.INTERNAL_SERVER_ERROR).
            json({ error: error.toString() });
        }
        if (!question) {
          return res.
            status(status.NOT_FOUND).
            json({ error: 'Not found' });
        }
        res.json({ question: question });
      });
    };
  }));

  // api.get('/category/parent/:id', wagner.invoke(function(Category) {
  //   return function(req, res) {
  //     Category.
  //       find({ parent: req.params.id }).
  //       sort({ _id: 1 }).
  //       exec(function(error, categories) {
  //         if (error) {
  //           return res.
  //             status(status.INTERNAL_SERVER_ERROR).
  //             json({ error: error.toString() });
  //         }
  //         res.json({ categories: categories });
  //       });
  //   };
  // }));

  return api;
};
