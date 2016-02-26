var request = require('request');
var Promise = require("bluebird");
var rp = require('request-promise');
var MD5 = require('./MD5');
var slug = require('slug');
var fileSystem=require("fs");

var numberOfQuestions;
var numberOfQuestionsPrepared;
var numberOfOptionsToBeGenerated;
var ifAllHasBeenRequested=false;

module.exports=function makeClaimAndPrepareArrayOfUris (req, res, next){
  var pIdForVar=req.body.data["pIdForVar"].split('P');
  var qIdForVar=req.body.data["qIdForVar"].split('Q');
  var pIdForOpt=req.body.data["pIdForOpt"].split('P');
  var questionStub=req.body.data["questionStub"];
  var topicIds=req.body.data["topicIds"];
  numberOfOptionsToBeGenerated=req.body.data["numberOfOptionsToBeGenerated"];
  numberOfQuestions=req.body.data["numberOfQuestions"];
  numberOfQuestionsPrepared=0;
  console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&"+numberOfQuestions);
  console.log(req.body.data);

  var searchUri="http://wdq.wmflabs.org/api?q=claim["+pIdForVar[1]+":"+qIdForVar[1]+"] and claim["+pIdForOpt[1]+"]";
  // console.log(searchUri);
  request(searchUri, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var wholePageAsObject = JSON.parse(body);
      numberOfQuestionsCreated=wholePageAsObject["items"].length;
      if (numberOfQuestions === "ALL") {
        ifAllHasBeenRequested=true;
        console.log("@@@@@@@@@@@@@@@@@@@@@@@"+"ALL questions has been recieved");
        numberOfQuestions=numberOfQuestionsCreated;
      }
      // console.log(numberOfQuestionsCreated);
      // console.log(searchUri);

      var start=0;
      var numberOfRecordsToBeProcessed=200;
      var end=start+numberOfRecordsToBeProcessed;

      while (end !== numberOfQuestions) {
        var arrayOfUri=[];

        if (end > numberOfQuestions) {
          end=numberOfQuestions;
        }
        for (var i = start; i < end; i++) { //set 200 as limit here...
          arrayOfUri.push('https://www.wikidata.org/wiki/Special:EntityData/Q'+wholePageAsObject["items"][i]+'.json');

        }
        getDescriptionForEachEntity(arrayOfUri,pIdForOpt[1],res,questionStub,topicIds);
      }


      // console.log("Number of questions generated " + numberOfQuestionsCreated);
    }
    // console.log(arrayOfRequestsToBePromised);

});


}
function getDescriptionForEachEntity(arrayOfUri,pIdForOpt,res,questionStub,topicIds){
  // console.log("arrayOfUri");
  // console.log(arrayOfUri);
var arrayOfRequestsToBePromised=[];
var arrayOfObjectsForEachEntity=[];
var objectToContainVariableAndAnswer={};
var dataType;
var imageArray={};
pIdForOpt='P'+pIdForOpt;



for (var i = 0; i < arrayOfUri.length; i++) {
  arrayOfRequestsToBePromised.push(rp(arrayOfUri[i])
    .then(function (body) {
        var obj = JSON.parse(body);
        arrayOfObjectsForEachEntity.push(obj["entities"]);
    })
    .catch(function (err) {
        // Crawling failed...
    }));
}

  Promise.all(arrayOfRequestsToBePromised).then(function() {
    console.log("Name LookUp Over");
    // console.log(arrayOfObjectsForEachEntity);
    for (var i = 0; i < arrayOfObjectsForEachEntity.length; i++) {
      console.log(i);
      for (var firstTempVarForKeyRunover in arrayOfObjectsForEachEntity[i]) {
        if (arrayOfObjectsForEachEntity[i].hasOwnProperty(firstTempVarForKeyRunover)) {
          // console.log(firstTempVarForKeyRunover);
          if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"][pIdForOpt] !== undefined){
            var tempStorageForData=arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"][pIdForOpt];
            var tempStorageForAnswers=[];

            // if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined){
            //   imageArray[firstTempVarForKeyRunover]=arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"];
            //
            //   console.log(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
            //   // imageArray.push(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
            // }
            // else {
            //   console.log("no image");
            //   imageArray[firstTempVarForKeyRunover]="";
            //   // imageArray.push("");
            // }


            for (var j = 0; j < tempStorageForData.length; j++) {

            dataType=tempStorageForData[j]["mainsnak"]["datatype"];
            // console.log(dataType);
            if(tempStorageForData[j]["mainsnak"]["datavalue"] !== undefined){


              if(dataType==="url" || dataType==="string"){
                tempStorageForAnswers[j]=tempStorageForData[j]["mainsnak"]["datavalue"]["value"];
              }
              else if (dataType==="commonsMedia") {
                var uriOfImage=generateImageUrl(tempStorageForData[j]["mainsnak"]["datavalue"]["value"].replace(/ /g,"_"));
                tempStorageForAnswers[j]='<img src="'+uriOfImage+'" alt="'+uriOfImage+'" height="42" width="42">';
              }
              else if (dataType==="wikibase-item") {
                tempStorageForAnswers[j]=tempStorageForData[j]["mainsnak"]["datavalue"]["value"]["numeric-id"];
              }
              else if (dataType==="time") {
                // var timeFromWikidata=tempStorageForData[j]["mainsnak"]["datavalue"]["value"]["time"];
                // console.log(timeFromWikidata);
                // timeFromWikidata=timeFromWikidata.replace("+","");
                // console.log(timeFromWikidata);
                // tempStorageForAnswers[j]=new Date(timeFromWikidata);
                tempStorageForAnswers[j]=tempStorageForData[j]["mainsnak"]["datavalue"]["value"]["time"];

              }

              // if more than one correct answer but there is some condition associated with it.. pick up the first one.
              if (tempStorageForData.length>1 && tempStorageForData[j]["qualifiers"] !== undefined) {
                j=tempStorageForData.length+1;
              }
            }
          }
          // console.log(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]);
            if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]!== undefined) {
              if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"] !== undefined){
                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"]["value"]]=tempStorageForAnswers;
                if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined){
                  imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"]["value"]]=arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"];

                  // console.log(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
                  // imageArray.push(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
                }
                else {
                  // console.log("no image");
                  imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"]["value"]]="";
                  // imageArray.push("");
                }
              }
              else if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"] !== undefined) {
                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]]=tempStorageForAnswers;

                if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined){
                  imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]]=arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"];

                  // console.log(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
                  // imageArray.push(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
                }
                else {
                  // console.log("no image");
                  imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]]="";
                  // imageArray.push("");
                }


              }
              else {
                var labelsAvailable=Object.keys(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]);
                // console.log(labelsAvailable);
                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]]=tempStorageForAnswers;
                if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined){
                  imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]]=arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"];

                  // console.log(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
                  // imageArray.push(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
                }
                else {
                  // console.log("no image");
                  imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]]="";
                  // imageArray.push("");
                }
                // console.log("description not in english");
              }
            }
            else {
              // console.log("Label is undefined");
            }

          }
        }
      }
    }
    // console.log(objectToContainVariableAndAnswer);
    // console.log(imageArray);
    if(dataType==="wikibase-item"){
      getNameForOptionPid(objectToContainVariableAndAnswer,imageArray,questionStub,res,topicIds);

    }
    else {
      generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,imageArray,questionStub,res,topicIds);
    }
    // console.log(objectToContainVariableAndAnswer);

    // res.send(arrayOfObjectsForEachEntity);

  });

}

function getNameForOptionPid(objectToContainVariableAndAnswer,imageArray,questionStub,res,topicIds){
  var searchUri;
  var arrayOfObjectsForEachEntity=[];
  var arrayOfRequestsToBePromised=[];
  var eachEntityName={};

  for (var firstTempVarForKeyRunover in objectToContainVariableAndAnswer) {
    if (objectToContainVariableAndAnswer.hasOwnProperty(firstTempVarForKeyRunover)) {
      // console.log(firstTempVarForKeyRunover);
      for (var i = 0; i < objectToContainVariableAndAnswer[firstTempVarForKeyRunover].length; i++) {
        searchUri='https://www.wikidata.org/wiki/Special:EntityData/Q'+objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]+'.json'
        arrayOfRequestsToBePromised.push(rp(searchUri)
          .then(function (body) {
              var obj = JSON.parse(body);
              // console.log(obj);
              arrayOfObjectsForEachEntity.push(obj);
          })
          .catch(function (err) {
              // Crawling failed...
          }));
        // console.log(objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]);
      }
    }
  }

    Promise.all(arrayOfRequestsToBePromised).then(function() {
      // console.log("Promises Done");
      // console.log(arrayOfObjectsForEachEntity);
      // res.send(arrayOfObjectsForEachEntity);
      for (var i = 0; i < arrayOfObjectsForEachEntity.length; i++) {
        // console.log("i = "+i);
        var key=Object.keys(arrayOfObjectsForEachEntity[i]["entities"]);
        if (arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]!== undefined) {
          if(arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["en"] !== undefined){
            eachEntityName[key]=arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["en"]["value"];
          }
          else if (arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["es"] !== undefined) {
            eachEntityName[key]=arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["es"]["value"];
          }
          else {
            var labelsAvailable=Object.keys(arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]);
            // console.log(labelsAvailable);
            eachEntityName[key]=arrayOfObjectsForEachEntity[i]["entities"][key]["labels"][labelsAvailable[0]]["value"];
          }
        }
      }

      for (var firstTempVarForKeyRunover in objectToContainVariableAndAnswer) {
        if(objectToContainVariableAndAnswer.hasOwnProperty(firstTempVarForKeyRunover)){
          for (var i = 0; i < objectToContainVariableAndAnswer[firstTempVarForKeyRunover].length; i++) {
            objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]=eachEntityName['Q'+objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]];
          }
        }
      }
      // console.log(objectToContainVariableAndAnswer);
      generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,imageArray,questionStub,res,topicIds)

    });

}

function generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,imageArray,questionStub,res,topicIds){
  console.log("in generate questions function");
  // var counterForImageArray=0;
  var counterForQuesArray=0;
  var imageLinks=generateArrayofImageUrl(imageArray);
  var arrayForQuestionData=[];
  // console.log(objectToContainVariableAndAnswer);
  // console.log(imageArray);
  for (var firstTempVarForKeyRunover in objectToContainVariableAndAnswer) {
    if(objectToContainVariableAndAnswer.hasOwnProperty(firstTempVarForKeyRunover)){
      // for (var i = 0; i < objectToContainVariableAndAnswer[firstTempVarForKeyRunover].length; i++) {
        var tempObjForQuesAndAns={};
        tempObjForQuesAndAns["question"]=questionStub["pre"]+firstTempVarForKeyRunover+questionStub["post"];
        tempObjForQuesAndAns["answer"]=objectToContainVariableAndAnswer[firstTempVarForKeyRunover];
        tempObjForQuesAndAns["image"]=imageLinks[firstTempVarForKeyRunover];
        arrayForQuestionData[counterForQuesArray]=tempObjForQuesAndAns;
        // console.log(tempObjForQuesAndAns);
        counterForQuesArray++;
      // }
      // counterForImageArray++;

    }

  }
  // console.log(arrayForQuestionData);
  generateDistractors(arrayForQuestionData,res,topicIds);
  // res.send(arrayForQuestionData);
  // console.log(allCorrectAnswers);
}


function generateDistractors(arrayForQuestionData,res,topicIds){
  var poolOfAllUniqueAnswers=[];
  var arrayOfObjsQuesAndDistractor=[];
  var counterForQuesArray=0;
  for (var i = 0; i < arrayForQuestionData.length; i++) {
    for (var j = 0; j < arrayForQuestionData[i]["answer"].length; j++) {
      if(poolOfAllUniqueAnswers.indexOf(arrayForQuestionData[i]["answer"][j])==-1){
        poolOfAllUniqueAnswers.push(arrayForQuestionData[i]["answer"][j]);
      }
    }
  }

fileSystem.open('./tempFileToStoreQues.json','w', function(err,fd){});

  for (var i = 0; i < arrayForQuestionData.length; i++) {
    for (var j = 0; j < arrayForQuestionData[i]["answer"].length; j++) {
      var tempObjToStoreQueAnsDis={};
      var distractor=[];
      for (var k = 0; k < numberOfOptionsToBeGenerated-1; k++) {
          var potentailDistractor=getARandonAnsweFromPoolOfAns(poolOfAllUniqueAnswers);
          if(arrayForQuestionData[i]["answer"].indexOf(potentailDistractor) == -1 && distractor.indexOf(potentailDistractor)==-1){
            distractor.push(potentailDistractor);
          }
          else {
            k--;
          }
        }
        // console.log(arrayForQuestionData[i]["question"]);
        // console.log(slug(arrayForQuestionData[i]["question"]));
        // console.log(MD5(slug(arrayForQuestionData[i]["question"])));


        var correctIndex=Math.floor(Math.random() * numberOfOptionsToBeGenerated) + 1;
        console.log("correctIndex " + correctIndex);

        tempObjToStoreQueAnsDis["questionId"]=MD5(slug(arrayForQuestionData[i]["question"]));
        tempObjToStoreQueAnsDis["question"]=arrayForQuestionData[i]["question"];
        tempObjToStoreQueAnsDis["image"]=arrayForQuestionData[i]["image"];
        // tempObjToStoreQueAnsDis["answer"]=arrayForQuestionData[i]["answer"][j];
        // tempObjToStoreQueAnsDis["distractor"]=distractor;
        tempObjToStoreQueAnsDis["topicIds"]=topicIds;
        // tempObjToStoreQueAnsDis["topicIds"]=['T1','T2'];
        for (var l = 1,m=0; l <= distractor.length+1; l++) {
          if (l !== correctIndex) {
            tempObjToStoreQueAnsDis["option"+l]=distractor[m];
            m++;
          }
          else {
            tempObjToStoreQueAnsDis["option"+l]=arrayForQuestionData[i]["answer"][j];
          }
        }
        tempObjToStoreQueAnsDis["correctIndex"]=correctIndex;
        console.log("##########################################################");
        console.log(tempObjToStoreQueAnsDis);

        fileSystem.appendFile('./tempFileToStoreQues.json', JSON.stringify(tempObjToStoreQueAnsDis) + '\n', encoding='utf8', function (err) {
            if (err) throw err;
        });
        numberOfQuestionsPrepared++;

        // write into file here...
        if (!ifAllHasBeenRequested) {
          arrayOfObjsQuesAndDistractor[counterForQuesArray++]=tempObjToStoreQueAnsDis;
        }
      }
    }

    if (!ifAllHasBeenRequested) {
      arrayOfObjsQuesAndDistractor[counterForQuesArray]=numberOfQuestionsCreated;
      console.log(arrayOfObjsQuesAndDistractor);
      res.send(arrayOfObjsQuesAndDistractor);
    }
    else {
      var filePath='./tempFileToStoreQues.json';
    //call d api and res.send the data what returns
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      res.send(filePath);
    //   fileSystem.readFile("./tempFileToStoreQues.json",{encoding:"utf8"}, function(err,data){
    //   if (err) {
    //       throw err;
    //   }
    //   var questionArray=data.split(/\r\n|\n/);
    //
    //   console.log(data.split(/\r\n|\n/));
    //   // console.log(JSON.parse(data));
    //   // console.log(data);
    //   res.send("JSON.parse(data)");
    // });
    }



  }


  function getARandonAnsweFromPoolOfAns(poolOfAllUniqueAnswers){
    var randomIndex = Math.floor(Math.random() * poolOfAllUniqueAnswers.length);
    return(poolOfAllUniqueAnswers[randomIndex]);
  }







function generateArrayofImageUrl(arrayOfImageUrlFromWiki) { // function to generate final Image Url from Image Text of Wikidata
      //  var arrayOfImageUrl = []; // array to be returned .. it will contain url of the image
      //  for (var i = 0; i < arrayOfImageUrlFromWiki.length; i++) { // iterate for each Image Text value picked from wikidata
      //      if (arrayOfImageUrlFromWiki[i] === "") { // if the image field was not found in wikidata for a perticular entity
      //          arrayOfImageUrl[i] = "No Image Available In Wikidata"; // set the array element as image not found
      //      } else {
      //          arrayOfImageUrl[i] = generateImageUrl(arrayOfImageUrlFromWiki[i].replace(/ /g,"_")); // else generateImageUrl
      //      }
      //  }
      //  return arrayOfImageUrl; // return the array with url of imaages

       var arrayOfImageUrl = {}; // array to be returned .. it will contain url of the image
       for (var firstTempVarForKeyRunover in arrayOfImageUrlFromWiki) { // iterate for each Image Text value picked from wikidata
           if (arrayOfImageUrlFromWiki.hasOwnProperty(firstTempVarForKeyRunover)) { // if the image field was not found in wikidata for a perticular entity
             if (arrayOfImageUrlFromWiki[firstTempVarForKeyRunover]==="") {
               arrayOfImageUrl[firstTempVarForKeyRunover] = "No Image Available In Wikidata"; // set the array element as image not found
             }
             else {
               arrayOfImageUrl[firstTempVarForKeyRunover] = generateImageUrl(arrayOfImageUrlFromWiki[firstTempVarForKeyRunover].replace(/ /g,"_")); // else generateImageUrl
            }
          }
       }
       return arrayOfImageUrl; // return the array with url of imaages
   }

   function generateImageUrl(urlFromWikidata) { // function will be called from generateArrayofImageUrl..
                                              // This function accepts an string of image.. and returns that urls
                                              // Note that this function works only for a single image
                                              // it is the dutu of generateArrayofImageUrl to call it multiple times
                                              // so that an array of images could be processed

     var commonUrl = "https://upload.wikimedia.org/wikipedia/commons/"; // this is the common url prepeded for each image Url
     var urlOfImage; // this variable will be returned .. containing urlOfImage .. note that a single image

     var hashOfUrlFromWikidata = generateMd5Hash(urlFromWikidata); // the image is stored in a link which uses hash in its url
                                                                   // so for e.g the wikidata will give us BACHCHAN Amitabh 03-24x30-2009b.jpg
                                                                   // then our function generateArrayofImageUrl will recieve BACHCHAN_Amitabh_03-24x30-2009b.jpg
                                                                   // the we need to find hash of BACHCHAN_Amitabh_03-24x30-2009b.jpg
                                                                   // the MD5 hash will be "9af6a0bed15f2b0b48997a02d925b277"
                                                                   // so we need to take out 9 and 9a out of it..

     urlOfImage = commonUrl + hashOfUrlFromWikidata.slice(0, 1) + "/" + hashOfUrlFromWikidata.slice(0, 2) + "/" + urlFromWikidata;
     // commonUrl is common accross all entities.. slice(0,1) will fetch us the first charecter of hashed data
     // slice(0,2) will give us first and 2nd charecter of hashed data
     // then we need to append it with the string in form BACHCHAN_Amitabh_03-24x30-2009b.jpg

     return urlOfImage; // return the url of image.. this is for a single image..
 }

 function generateMd5Hash(stringToBeHashed) {  // function to generateMd5Hash
       hashedString = MD5(stringToBeHashed); // call MD5 function.. MD5 is a 3rd party function.. picked up from web
       return hashedString; // return the hashed string
   }
