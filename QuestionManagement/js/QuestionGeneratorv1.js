var Question = {
                  ques: "",
                  options: ["op1","op2","op3","op4"],
                  answer: -1
                },
    fileName = "QuestionBank.json";
var fs = require("fs");
  fs.appendFile(fileName,"[")
for(var i=1;i<=1000;i++){
  if(i!=1){
      fs.appendFile(fileName,",");
  }
  Question.ques = "q" + i;
  Question.answer = Math.round(Math.random()*4) % 4;
  var questionObjStrigyfied = JSON.stringify(Question,null,"\t");
  fs.appendFile(fileName,questionObjStrigyfied);
}

fs.appendFile(fileName,"]");
