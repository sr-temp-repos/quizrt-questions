var express = require('express');
var router = express.Router();
var mongoose=require('mongoose');

/* GET home page. */
router.post('/', function(req, res, next) {

  // console.log("in save question pattern");
  // console.log(req.body);
  // console.log(req.body.data["pIdForVar"]);
  // console.log(req.body.data["qIdForVar"]);
  // console.log(req.body.data["pIdForOpt"]);
  // console.log(req.body.data["questionStub"]["pre"]);
  // console.log(req.body.data["questionStub"]["var"]);
  // console.log(req.body.data["questionStub"]["post"]);
  // console.log(req.body.data["topicIds"]);
  var questionPatterns=require('../schema/questionPatternSchema.js');

  var addQuestionPattern = new questionPatterns({
  'patternId':req.body.data["pIdForVar"]+req.body.data["qIdForVar"]+req.body.data["qIdForVar"],
  'pIdForVar': req.body.data["pIdForVar"],
  'qIdForVar': req.body.data["qIdForVar"],
  'pIdForOpt': req.body.data["pIdForOpt"],  // Notice the use of a String rather than a Number - Mongoose will automatically convert this for us.
  'topicIds': req.body.data["topicIds"],
  'questionStub': {
    'pre': req.body.data["questionStub"]["pre"],
    'var':req.body.data["questionStub"]["var"],
    'post':req.body.data["questionStub"]["post"]
  }
});
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
        res.send("Question Stub successfully Saved to Mongo :-) ");
      });
    }
    else {
      foundObject.topicIds=addQuestionPattern.topicIds;
      foundObject.questionStub=addQuestionPattern.questionStub;
      foundObject.save(function(err, newQuestionPattern) {
        if (err) return console.error(err);
        console.dir(newQuestionPattern);
        res.send("Duplicate Stub Pattern Found... Updated The Same Record....");
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
