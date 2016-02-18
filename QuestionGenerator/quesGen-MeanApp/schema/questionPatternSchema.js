var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionStubSchema = new Schema({
  patternId:{type:String , required:true},
  pIdForVar: { type: String, required:true}, 
  qIdForVar: { type: String, required:true}, 
  pIdForOpt: { type: String, required:true}, 
  questionStub: { 
    pre:{type: String}, 
    var:{type: String, required:true}, 
    post:{type: String} 
  }, 
  topicIds: {type:[String],required:true}
});

module.exports = mongoose.model('QuestionPattern', questionStubSchema,'questionPattern');
