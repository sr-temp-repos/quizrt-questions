var mongoose = require('mongoose');
var topic = require('./topic');
var category = require('./category')
var fs = require('fs');

mongoose.connect('mongodb://localhost/test');


// Parameters are: model name, schema, collection name
var Topic = mongoose.model('Topic', topic, 'Topics');
var Category = mongoose.model('Categories',category, 'Categories');

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
    var c1 = new Category({_id: 'C1',name: 'sport', imageUrl: ''});
    var c2 = new Category({_id: 'C2',name: 'animal', imageUrl: ''});

    // c1.save(function(err) {
    //   console.log(err);
    // });
    // c2.save();
    for(var prop in json) {
      prop = prop+'';
      var topic;
      // console.log(c1._id);
      if(json[prop].category == 'sport') {
        topic = new Topic({_id: json[prop].topicId, name: json[prop].name, imageUrl: '', category: c1._id});
      } else {
        topic = new Topic({_id: json[prop].topicId, name: json[prop].name, imageUrl: '', category: c2._id});
      }
      console.log(topic);
      topic.save(function(err){
         console.log(err);
      });
    }
    console.log('completed saving data');
  }
});
