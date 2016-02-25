var express = require('express');
var router = express.Router();
//Load the request module
var request = require('request');
var Promise = require("bluebird");
var rp = require('request-promise');
var MD5 = require('./MD5');
var slug = require('slug');
var fileSystem = require("fs");

var makeClaimAndPrepareArrayOfUris=require('./generateQuestionsHelper')

var numberOfQuestionsCreated;
/* GET home page. */
router.post('/', function(req, res, next) {
// console.log("in generate questions-----------");
// console.log(req);
fileSystem.open('./tempFileToStoreQues.json','w', function(err,fd){
  fileSystem.close(fd, function(err){
       if (err){
          console.log(err);
       }
      //  console.log("File closed successfully.");
    });
  // fileDescriptorForStoreQues=fd;
});

fileSystem.open('./tempFileToStoreIntermediary.json','w', function(err,fd){
  fileSystem.close(fd, function(err){
       if (err){
          console.log(err);
       }
      //  console.log("File closed successfully.");
    });
  // fileDescriptorForStoreIntermediary=fd;

});
 tempFileDescForInter=fileSystem.openSync('./tempFileToStoreIntermediary.json','a');
 tempFileDescForStore=fileSystem.openSync('./tempFileToStoreQues.json','a');


makeClaimAndPrepareArrayOfUris(req, res, next,tempFileDescForInter,tempFileDescForStore);


});

module.exports = router;
