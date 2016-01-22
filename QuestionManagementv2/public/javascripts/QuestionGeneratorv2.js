var fs = require('fs');


var generateRandomNumber = function(range) {
  return Math.round(Math.random()*range)%range + 1;
}

var dateFormater = function(tDate,dateSeparator) {
  return tDate.getDate() + dateSeparator + (tDate.getMonth()+1) + dateSeparator + (1900 + tDate.getYear());
}

fs.readFile( 'QuestionsJson/QuestionSample_2.json', function( err, data ) {
  var jsonData = JSON.parse(data),
      topics = {
                'T1':{topicId: 'T1', name:'cricket', category:'sport'},
                'T2':{topicId: 'T2', name:'baseball', category:'sport'},
                'T3':{topicId: 'T3', name:'football', category:'sport'},
                'T4':{topicId: 'T4', name:'cat', category:'animal'},
                'T5':{topicId: 'T5', name:'dog', category:'animal'},
                'T6':{topicId: 'T6', name:'elepant', category:'animal'}
              }
      topicsIdCollection = [];
  for( var i=0, len=jsonData.length ; i<len ; i++ ) {
    var noOfAttemps = generateRandomNumber(10000),
        dateCreated = new Date((1900 + generateRandomNumber(116))%2016 + '-' + generateRandomNumber(12) + '-' + + generateRandomNumber(28)),
        dateEdited = dateCreated;

    dateEdited.setDate(dateCreated.getDate() + generateRandomNumber(100));
    jsonData[i].image = 'http://placehold.it/150x150';
    topicRanPick = [
                    topics['T'+generateRandomNumber(6)],
                    topics['T'+generateRandomNumber(6)],
                    topics['T'+generateRandomNumber(6)]
                  ];
    jsonData[i].topicId = topicRanPick[0].topicId + ', ' + topicRanPick[1].topicId + ', ' + topicRanPick[2].topicId;
    jsonData[i].topics = topicRanPick[0].name + ', ' + topicRanPick[1].name + ', ' + topicRanPick[2].name;
    jsonData[i].categories = topicRanPick[0].category + ', ' + topicRanPick[1].category + ', ' + topicRanPick[2].category;
    jsonData[i].difficultyLevel = generateRandomNumber(10);
    jsonData[i].timesUsed = 10 + generateRandomNumber(10000);
    jsonData[i].correctRatio = generateRandomNumber(noOfAttemps) + '/' + noOfAttemps;
    jsonData[i].frequency = Math.round(jsonData[i].timesUsed/10);
    jsonData[i].createdOn = dateFormater(dateCreated, '/');
    jsonData[i].lastEdited =  dateFormater(dateEdited, '/');
  }
  fs.writeFile('QuestionsJson/QuestionSample_3.json',JSON.stringify(jsonData,null,'\t'));
  fs.writeFile('QuestionsJson/Topics_v1.json',JSON.stringify(topics,null,'\t'));
});
