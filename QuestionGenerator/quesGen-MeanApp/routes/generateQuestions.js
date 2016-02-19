var express = require('express');
var router = express.Router();
//Load the request module
var request = require('request');
var Promise = require("bluebird");
var rp = require('request-promise');
var MD5 = require('./MD5');
var slug = require('slug');
var makeClaimAndPrepareArrayOfUris=require('./generateQuestionsHelper')

var numberOfQuestionsCreated;
/* GET home page. */
router.post('/', function(req, res, next) {
// console.log("in generate questions-----------");
// console.log(req);
makeClaimAndPrepareArrayOfUris(req, res, next);


});

module.exports = router;
