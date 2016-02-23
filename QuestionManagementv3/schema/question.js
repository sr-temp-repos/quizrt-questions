var mongoose = require('mongoose');
var promise=require('promise');
var topic=require('./topic.js');

var TopicsModel = mongoose.model('Topics', topic, 'Topics');

var questionSchema = {
  questionId: {type: String, required: true},
  question: { type: String, required: true },
  // Images must start with "http://"
  image: { type: String},
  // option1: { type: String, required: true },
  // option2: { type: String, required: true },
  // option3: { type: String },
  // option4: { type: String },
  // option5: { type: String },
  // option6: { type: String },
  // option7: { type: String },
  // option8: { type: String },
  // option9: { type: String },
  // option10: { type: String },
  // option11: { type: String },
  // option12: { type: String },
  options: [{type: String, required: true}],
  correctIndex: { type: Number, required: true },
  difficultyLevel: { type: Number, required: true },
  timesUsed: { type: Number, required: true },
  correctRatio: { type: String, required: true },
  frequency: { type: Number, required: true },
  lastEdited: { type: Date, required: true },
  createdOn: { type: Date, required: true },
  topics: { type: String },
  topicId: {type: String },
  categories: {type: String },
  topicIds: [{type: String, required: true, ref: 'Topics'}]
};

var q=new mongoose.Schema(questionSchema);

module.exports = q;
module.exports.TopicsModel = TopicsModel;
