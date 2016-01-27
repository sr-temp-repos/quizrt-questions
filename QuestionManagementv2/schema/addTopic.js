var mongoose = require('mongoose');
var topic = require('./topic');
var fs = require('fs');

mongoose.connect('mongodb://localhost/test');


// Parameters are: model name, schema, collection name
var Topic = mongoose.model('Topic', topic, 'Topics');

function readJSONFile(filename, callback) {
  fs.readFile(filename, function (err, data) {
    if(err) {
      callback(err);
      return;
    }
    try {
      callback(null, JSON.parse(data));
    } catch(exception) {
      callback(exception);
    }
  });
}
var topics = [];
readJSONFile('../public/javascripts/QuestionsJson/Topics_v1.json',function(err, json) {
  if(json) {
    console.log(json);
    for(var prop in json) {
      prop = prop+'';
      console.log(json[prop]);
      var topic = new Topic({ _id: json[prop].topicId, name: json[prop].name, category: json[prop].category});
      topic.save();
      console.log(topic);
      // topics.push(topic);
    }
  }
});
