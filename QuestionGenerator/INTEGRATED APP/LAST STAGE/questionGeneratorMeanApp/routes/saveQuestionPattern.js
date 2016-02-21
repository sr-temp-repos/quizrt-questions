var express = require('express');
var router = express.Router();
var mongoose=require('mongoose');

/* GET home page. */
router.post('/', function(req, res, next) {
  console.log("here");
  var questionPatterns=require('../schema/questionPatternSchema.js');
  console.log("here");
  console.log(req.body.data);
  var addQuestionPattern = new questionPatterns({
  'patternId':req.body.data["pIdForVar"]+req.body.data["qIdForVar"]+req.body.data["qIdForVar"],
  'pIdForVar': req.body.data["pIdForVar"],
  'qIdForVar': req.body.data["qIdForVar"],
  'pIdForOpt': req.body.data["pIdForOpt"],  // Notice the use of a String rather than a Number - Mongoose will automatically convert this for us.
  'topicIds': req.body.data["topicIds"],
  'numberOfOptionsToBeGenerated':req.body.data["numberOfOptionsToBeGenerated"],
  'lastExecutedOn':"",
  'totalQuestionsGenerated':"",
  'successfullyInserted':"",
  'insertionFailedFor':"",
  'questionStub': {
    'pre': req.body.data["questionStub"]["pre"],
    'var':req.body.data["questionStub"]["var"],
    'post':req.body.data["questionStub"]["post"]
  }
});

//   var addQuestionPattern = new questionPatterns({
//   'patternId':"P1234",
//   'pIdForVar': "P123456",
//   'qIdForVar': "Q123",
//   'pIdForOpt': "P12",  // Notice the use of a String rather than a Number - Mongoose will automatically convert this for us.
//   'topicIds': req.body.data["topicIds"],
//   'numberOfOptionsToBeGenerated':"100",
//   'lastExecutedOn':"",
//   'totalQuestionsGenerated':"100",
//   'successfullyInserted':"100",
//   'insertionFailedFor':"0",
//   'questionStub': {
//     'pre': "HELLO",
//     'var':"HELLO1",
//     'post':"HELLO2"
//   }
// });


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
      res.send(foundObject);
      // foundObject.topicIds=addQuestionPattern.topicIds;
      // foundObject.questionStub=addQuestionPattern.questionStub;
      // foundObject.numberOfOptionsToBeGenerated=addQuestionPattern.numberOfOptionsToBeGenerated;
      //
      // foundObject.save(function(err, newQuestionPattern) {
      //   if (err) return console.error(err);
      //   console.dir(newQuestionPattern);
      //   res.send("Duplicate Stub Pattern Found... Updated The Same Record....     ");
      // });
    }
  }

});

  // questionPatterns.find(function(err, questionPatterns) {
//   if (err) return console.error(err);
//   res.send(questionPatterns);
// });
});

module.exports = router;
