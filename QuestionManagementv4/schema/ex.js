var mongoose = require('mongoose');
var fs = require('fs');

mongoose.connect('mongodb://localhost/newDB');

//var categorySchema = require('./category');
//var topic = require('./topic');
var Question = require('../models/question.js');

//
// Question.find({}).populate({
//   path: 'topicIds',
//   model: 'Topics',
//   populate: {
//     path: 'category',
//     model: 'Category'
// }}).exec(function(err, doc) {
// //  console.log(doc);
//   //console.log(doc[0].topicIds);
//   var topics = [],
//       categories = [],
//       topicId = [],
//       topicIds = doc[0].topicIds;
//   if(err) {
//     console.log(err);
//   }
//
//   for(var index=0, len= topicIds.length; index<len; index++) {
//     //console.log(topicIds[index]);
//     topics.push(topicIds[index].name);
//     categories.push(topicIds[index].category.name);
//     topicId.push(topicIds[index]._id);
//   }
//   //console.log(topics);
//   doc[0].topics = topics.join(', ');
//   doc[0].categories = categories.join(', ');
//   doc[0].topicId = topicId.join(', ');
//   console.log(doc[0]);
//   mongoose.connection.close();
// });




// var q = new Question({
//       questionId: "web301_q11",
//   		picture: "http://placehold.it/150x150",
//   		question: "Which of the following is a valid property in a hibernate configuration?",
//   		correctIndex: 4,
//   		// options:[{option1: "hibernate.dialect"},{option2: "hibernate.connection.url"},{option3: "show_sql"},{option4: "All of the above"}],
//       option1: "hibernate.dialect",
//       option2: "hibernate.connection.url",
//       option3: "show_sql",
//       option4: "All of the above",
//   		difficultyLevel: 5,
//   		timesUsed: 9123,
//   		correctRatio: "720/7931",
//   		frequency: 912,
//   		createdOn: "12/3/1973",
//   		lastEdited: "12/3/1973",
//       topicIds: ["T1", "T2", "T4"],
//       topics: "",
//       categories: "",
//       topicId: ""
//       // topics: [
//       //   {
//       //   		_id: "T1",
//       //   		name: "cricket",
//       //   		category: "sport"
//       //   },
//       //   {
//       // 		_id: "T2",
//       // 		name: "baseball",
//       // 		category: "sport"
//       // 	}
//       // ]
//
// });
// q.save(function(err) {
//   if(err)
//     console.log(err);
//
//   mongoose.connection.close();
// });
// // q.collectTopicInfo().then( function() {
// //   console.log(q.topics);
// // });

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

readJSONFile('../public/javascripts/QuestionsJson/QuestionSample_5.json',function(err, json) {
  if(json) {
    for(var i=0,len=json.length; i<len; i++) {
      json[i].topicId = json[i].topicId.split(', ');
      json[i].topics = "";
      json[i].topicIds = "";
      json[i].categories = "";
      var q = new Question(json[i]);
      q.save(function(err) {
        if(err)
        console.log(err);
      });
    }
    // mongoose.con
  }
});
