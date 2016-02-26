var express = require('express');
var router = express.Router();
var mongoose=require('mongoose');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("in get topics");

  var stubsList=require('../models/questionPatternSchema.js');
  stubsList.find({},function(err, stubsList) {
  if (err) return console.error(err);
  console.log(stubsList);
  res.send(stubsList);
});
});

module.exports = router;
