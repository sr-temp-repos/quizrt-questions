var mongoose = require('mongoose');
var fs = require('fs');

mongoose.connect('mongodb://localhost/newDB');


var Topic = require('../models/topic');
var Category = require('../models/category')

// Parameters are: model name, schema, collection name
// var Topic = mongoose.model('Topic', topic, 'Topics');
// var Category = mongoose.model('Categories',category, 'Categories');

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
    var index = 1;
    var c1 = new Category({_id: 'C1',categoryName: 'sport', imageUrl: ''});
    var c2 = new Category({_id: 'C2',categoryName: 'animal', imageUrl: ''});

    c1.save(function(err) {
      console.log(err);
    });
    c2.save();
    var sportArr = [], animalArr = [], i=0,j=0;
    for(var prop in json) {
      prop = prop+'';
      var topic;

      console.log(i + " " + sportArr);
      console.log(j + " " + animalArr);
      if(json[prop].category == 'sport') {

        console.log(json[prop].category);
        sportArr[i++] = json[prop].topicId;

        console.log(json[prop].category);
        topic = new Topic({_id: json[prop].topicId, topicName: json[prop].name, topicIcon: '', topicCategory: 'C1'});

        console.log(json[prop].category);
      } else {
        animalArr[j++] = json[prop].topicId;
        topic = new Topic({_id: json[prop].topicId, topicName: json[prop].name, topicIcon: '', topicCategory: 'C2'});
      }
      topic.save(function(err){
         console.log(err);
      });
    }
    console.log("Hello world");
    Category.update({_id: 'C1'}, {$set: {categoryTopics: sportArr}}, function(err, doc) {
      if(err){
        console.log(err);
        return;
      }
      console.log(doc)
    });

    Category.update({_id: 'C2'}, {$set: {categoryTopics: animalArr}}, function(err, doc) {
      if(err){
        console.log(err);
        return;
      }
      console.log(doc)
    });
    console.log('completed saving data');
  }
});
