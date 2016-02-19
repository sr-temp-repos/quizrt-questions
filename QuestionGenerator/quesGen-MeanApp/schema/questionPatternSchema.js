var mongoose = require('mongoose');
var Schema = mongoose.Schema;
console.log("lkasjdlkfjds");
var questionStubSchema = new Schema({
  patternId:{type:String },
  pIdForVar: { type: String}, 
  qIdForVar: { type: String}, 
  pIdForOpt: { type: String},
  topicIds: {type:[String]}, 
  numberOfOptionsToBeGenerated: {type:Number}, 
  lastExecutedOn: {type:Date},
  totalQuestionsGenerated: {type:Number},
  successfullyInserted: {type:Number}, 
  insertionFailedFor:{type:Number},
  questionStub: { 
    pre:{type: String}, 
    var:{type: String}, 
    post:{type: String} 
  } 
});
console.log("lkasjdlkfjds");
module.exports = mongoose.model('QuestionPattern', questionStubSchema,'questionPattern');
