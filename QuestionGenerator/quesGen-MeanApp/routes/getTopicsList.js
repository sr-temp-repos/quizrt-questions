var express = require('express');
var router = express.Router();
var mongoose=require('mongoose');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("in get topics");

  var topicsList=require('../schema/topicsListSchema.js');
  topicsList.find({},function(err, topicsList) {
  if (err) return console.error(err);
  console.log(topicsList);
  res.send(topicsList);
});
});

module.exports = router;
