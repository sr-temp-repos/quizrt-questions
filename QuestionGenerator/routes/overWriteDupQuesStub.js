var express = require('express');
var router = express.Router();
var mongoose=require('mongoose');

router.post('/', function(req, res, next) {
  console.log("here1");
  var questionPatterns=require('../models/questionPatternSchema.js');
  console.log("here1");
  console.log(req.body.data);
  console.log("asdasdasdasdasdasdasd"+req.body.data["lastExecutedOn"]);
  var addQuestionPattern = new questionPatterns({
  'patternId':req.body.data["pIdForVar"]+req.body.data["qIdForVar"]+req.body.data["pIdForOpt"],
  'pIdForVar': req.body.data["pIdForVar"],
  'qIdForVar': req.body.data["qIdForVar"],
  'pIdForOpt': req.body.data["pIdForOpt"],  // Notice the use of a String rather than a Number - Mongoose will automatically convert this for us.
  'topicIds': req.body.data["topicIds"],
  'numberOfOptionsToBeGenerated':req.body.data["numberOfOptionsToBeGenerated"],
  'lastExecutedOn':req.body.data["lastExecutedOn"],
  'totalQuestionsGenerated':req.body.data["totalQuestionsGenerated"],
  'successfullyInserted':req.body.data["successfullyInserted"],
  'insertionFailedFor':req.body.data["insertionFailedFor"],
  'questionStub': {
    'pre': req.body.data["questionStub"]["pre"],
    'var':req.body.data["questionStub"]["var"],
    'post':req.body.data["questionStub"]["post"]
  }
});

console.log("in overwrite");
console.log(addQuestionPattern);
// var patternId=req.body.data["pIdForVar"]+req.body.data["qIdForVar"]+req.body.data["qIdForVar"];
questionPatterns.findOne({patternId:addQuestionPattern.patternId},function(err,foundObject){
  if(err){
    console.log(err);
    res.status(500).send();
  }
  else {
    if(!foundObject){
      addQuestionPattern.save(function(err, newQuestionPattern) {
        if (err) return console.error(err);
        console.dir(newQuestionPattern);
        res.send("Question Stub successfully Saved to Mongo :-)     ");
      });
    }
    else {
      foundObject.topicIds=addQuestionPattern.topicIds;
      foundObject.questionStub=addQuestionPattern.questionStub;
      foundObject.numberOfOptionsToBeGenerated=addQuestionPattern.numberOfOptionsToBeGenerated;
      foundObject.lastExecutedOn=addQuestionPattern.lastExecutedOn;
      foundObject.totalQuestionsGenerated=addQuestionPattern.totalQuestionsGenerated;
      foundObject.successfullyInserted=addQuestionPattern.successfullyInserted;
      foundObject.insertionFailedFor=addQuestionPattern.insertionFailedFor;

      foundObject.save(function(err, newQuestionPattern) {
        if (err) return console.error(err);
        console.dir(newQuestionPattern);
        res.send("Updated The Question Stub");
      });
    }
  }

});

  // questionPatterns.find(function(err, questionPatterns) {
//   if (err) return console.error(err);
//   res.send(questionPatterns);
// });
});

module.exports = router;
