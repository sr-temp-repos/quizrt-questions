var express = require('express');
var router = express.Router();
var mongoose=require('mongoose');

/* GET home page. */
router.get('/', function(req, res, next) {

  var ExclusionList=require('../schema/exclusionListSchema.js')
  ExclusionList.find(function(err, exclusionList) {
  if (err) return console.error(err);
  res.send(exclusionList);
});
});

module.exports = router;
