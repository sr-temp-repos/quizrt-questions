var mongoose = require('mongoose');
var promise=require('promise');
var topic=require('./topic.js');


var questionSchema = {
  questionId: {type: String, required: true},
  question: { type: String, required: true },
  // Pictures must start with "http://"
  picture: { type: String, match: /^http:\/\//i },
  // options: [],
  option1: { type: String, required: true},
  option2: { type: String, required: true},
  option3: { type: String, required: true},
  option4: { type: String, required: true},
  correctIndex: { type: Number, required: true },
  difficultyLevel:{ type: Number, required: true },
  timesUsed:{ type: Number, required: true },
  correctRatio: { type: String, required: true },
  frequency:{ type: Number, required: true },
  lastEdited:{ type: Date, required: true },
  createdOn:{ type: Date, required: true },
  // topics: { type: String, required: true},
  topicId: { type: String, required: true},
  // categories: { type: String, required: true}
  // topics: [topic.topicSchema]
};
var q=new mongoose.Schema(questionSchema);



q.methods.collectTopicInfo = function() {
  mongoose.connect('mongodb://localhost/test');
  var self = this;
  var Topic = mongoose.model('Topic', topic, 'Topics');
  var topics = [],
      categories = [];

  var topicIds = self.topicId.replace(/\s/g,'').split(',');

  var promise = new Promise(function (resolve, reject) {
    Topic.find({_id: { $in : topicIds}},function(err,docs){
      if(err) {
        reject();
        return;
      }
      for(var index in docs) {
        topics.push(docs[index].name);
        categories.push(docs[index].category);
      }
      self.topics = topics.join(', ');
      self.categories = categories.join(', ');
      mongoose.connection.close();
      resolve(this);
    });
  });
  return promise;
}
//mongoose.connection.close();
// q.virtual(questionSchema.tarr).set(function (questionSchema) {
//   var tarr=[];
//   //console.log(this);
//   var tid_split=questionSchema.topicId.split(",");
//   var t_split=questionSchema.topics.split(",");
//   var c_split=questionSchema.categories.split(",");
//   for (var i = 0; i < tid_split.length; i++) {
//     var topic={};
//     topic["_id"]=tid_split[i];
//     topic["name"]=t_split[i];
//     topic["category"]=c_split[i];
//     tarr.push(topic);
//   }
//   // return tarr;
//   // return this.name.first + ' ' + this.name.last;
// });
module.exports = q;
module.exports.questionSchema = questionSchema;
