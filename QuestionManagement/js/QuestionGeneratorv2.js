var fs = require('fs');


var generateRandomNumber = function(range) {
  return Math.round(Math.random()*range)%range + 1;
}

fs.readFile( 'QuestionsJson/QuestionSample_2.json', function( err, data ) {
  var jsonData = JSON.parse(data),
      topics = {
                'T1':{name:'cricket', category:'sport'},
                'T2':{name:'baseball', category:'sport'},
                'T3':{name:'football', category:'sport'},
                'T4':{name:'cat', category:'animal'},
                'T5':{name:'dog', category:'animal'},
                'T6':{name:'elepant', category:'animal'}
              }
      topicsIdCollection = [];
  for( var i=0, len=jsonData.length ; i<len ; i++ ) {
    var noOfAttemps = generateRandomNumber(10000);
    jsonData[i].image = 'http://placehold.it/150x150';
    jsonData[i].topicId = ['T'+generateRandomNumber(6),'T'+generateRandomNumber(6),'T'+generateRandomNumber(6)];
    jsonData[i].difficultyLevel = generateRandomNumber(10);
    jsonData[i].timesUsed = 10 + generateRandomNumber(10000);
    jsonData[i].correctRatio = generateRandomNumber(noOfAttemps) + ':' + noOfAttemps;
    jsonData[i].frequency = jsonData[i].timesUsed/10;
    jsonData[i].createdOn = new Date((1900 + generateRandomNumber(116))%2016 + '-' + generateRandomNumber(12) + '-' + + generateRandomNumber(28));
    jsonData[i].lastEdited = jsonData[i].createdOn;
    jsonData[i].lastEdited.setDate(jsonData[i].createdOn.getDate() + generateRandomNumber(8));
  }
  fs.writeFile('QuestionsJson/QuestionSample_3.json',JSON.stringify(jsonData,null,'\t'));
  fs.writeFile('QuestionsJson/Topics_v1.json',JSON.stringify(topics,null,'\t'));
});
