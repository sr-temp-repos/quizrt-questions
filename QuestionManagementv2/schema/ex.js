var mongoose = require('mongoose');
var promise = require('promise');
var questionSchema = require('./question.js');

var Question = mongoose.model('Question', questionSchema);

var q = new Question({
      questionId: "web301_q11",
  		picture: "http://placehold.it/150x150",
  		question: "Which of the following is a valid property in a hibernate configuration?",
  		correctIndex: 4,
  		// options:[{option1: "hibernate.dialect"},{option2: "hibernate.connection.url"},{option3: "show_sql"},{option4: "All of the above"}],
      option1: "hibernate.dialect",
      option2: "hibernate.connection.url",
      option3: "show_sql",
      option4: "All of the above",
  		difficultyLevel: 5,
  		timesUsed: 9123,
  		correctRatio: "720/7931",
  		frequency: 912,
  		createdOn: "12/3/1973",
  		lastEdited: "12/3/1973",
      topicId: "T1, T2, T4",
  		// topics: "cricket, baseball, cat",
  		// categories: "sport, sport, animal",
      // topics: [
      //   {
      //   		_id: "T1",
      //   		name: "cricket",
      //   		category: "sport"
      //   },
      //   {
      // 		_id: "T2",
      // 		name: "baseball",
      // 		category: "sport"
      // 	}
      // ]

});
q.collectTopicInfo().then( function(self) {
  console.log(q);
});
