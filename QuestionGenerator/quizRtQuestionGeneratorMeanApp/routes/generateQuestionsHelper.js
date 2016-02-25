var request = require('request');
var Promise = require("Q");
var rp = require('request-promise');
var MD5 = require('./MD5');
var slug = require('slug');
var fileSystem = require("fs");
var LineByLineReader = require('line-by-line');

var redis = require('redis');


module.exports = function makeClaimAndPrepareArrayOfUris(req, res, next,tempFileDescForStore,tempFileDescForStore) {
  // var client = redis.createClient(); //creates a new client

  // var numberOfQuestions;
  // var numberOfQuestionsPrepared;
  // var numberOfOptionsToBeGenerated;
   ifAllHasBeenRequested = false;

   startIndex = 0;
   numberOfRecordsToBeProcessed = 20;
   endIndex = startIndex + numberOfRecordsToBeProcessed;
   numberOfRecordsAlreadyProcessed = 0;
   poolOfAllUniqueAnswers = [];
   numberOfRecordsCurrProcessing = 0;


    var pIdForVar = req.body.data["pIdForVar"].split('P');
    var qIdForVar = req.body.data["qIdForVar"].split('Q');
    var pIdForOpt = req.body.data["pIdForOpt"].split('P');
    var questionStub = req.body.data["questionStub"];
    var topicIds = req.body.data["topicIds"];
    numberOfOptionsToBeGenerated = req.body.data["numberOfOptionsToBeGenerated"];
    numberOfQuestions = req.body.data["numberOfQuestions"];
    numberOfQuestionsPrepared = 0;

    var searchUri = "http://wdq.wmflabs.org/api?q=claim[" + pIdForVar[1] + ":" + qIdForVar[1] + "] and claim[" + pIdForOpt[1] + "]";

    request(searchUri, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var wholePageAsObject = JSON.parse(body);
            numberOfQuestionsCreated = wholePageAsObject["items"].length;
            if (numberOfQuestions === "ALL") {
                ifAllHasBeenRequested = true;
                console.log("@@@@@@@@@@@@@@@@@@@@@@@" + "ALL questions has been recieved");
                // numberOfQuestions = numberOfQuestionsCreated;
                numberOfQuestions = 750;
            }
            if (endIndex>numberOfQuestions) {
              endIndex=numberOfQuestions;
            }
            aRecursiveFunctionForSendingRequest(wholePageAsObject["items"], pIdForOpt[1], startIndex, endIndex);

            function aRecursiveFunctionForSendingRequest(wholePageAsObject, pIdForOpt, startIndex, endIndex) {
                var arrayOfUri = [];
                console.log(numberOfQuestions);
                console.log(startIndex);
                console.log(endIndex);
                for (var i = startIndex; i < endIndex; i++) {
                    arrayOfUri.push('https://www.wikidata.org/wiki/Special:EntityData/Q' + wholePageAsObject[i] + '.json');
                }

                getDescriptionForEachEntity(arrayOfUri, pIdForOpt)
                    .then(function(resultsArray) {
                        console.log("request done");
                        // console.log(resultsArray[0]);
                        // console.log(resultsArray[1]);
                        // console.log(resultsArray[2]);
                        // console.log(resultsArray[3]);

                        var objectToContainVariableAndAnswer = resultsArray[0];
                        var imageArray = resultsArray[1];
                        var dataType = resultsArray[2];
                        var objectToContainIfPopularOrNot=resultsArray[3];
                        console.log(" data type = " +  dataType);
                        if (dataType === "wikibase-item") {
                            getNameForOptionPid(objectToContainVariableAndAnswer)
                                .then(function(resultsArray) {
                                    console.log("request done from getNameForOptionPid");
                                    console.log(resultsArray);
                                    console.log(imageArray);

                                    generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,objectToContainIfPopularOrNot, imageArray,questionStub,tempFileDescForInter)
                                        .then(function(resultsArray) {
                                          console.log(resultsArray);
                                          console.log("start... " + startIndex);
                                          console.log("end... " + endIndex);
                                            if (endIndex < numberOfQuestions) {
                                              console.log("in  if... not the last time");

                                                startIndex += numberOfRecordsToBeProcessed;
                                                endIndex = startIndex + numberOfRecordsToBeProcessed;
                                                if (endIndex > numberOfQuestions) {
                                                    endIndex = numberOfQuestions;
                                                    aRecursiveFunctionForSendingRequest(wholePageAsObject, pIdForOpt, startIndex, endIndex);
                                                }
                                                else if (endIndex < numberOfQuestions) {
                                                  aRecursiveFunctionForSendingRequest(wholePageAsObject, pIdForOpt, startIndex, endIndex);
                                                }
                                                else if (endIndex === numberOfQuestions) {
                                                  aRecursiveFunctionForSendingRequest(wholePageAsObject, pIdForOpt, startIndex, endIndex);

                                                }
                                            }
                                            else if (endIndex === numberOfQuestions) {
                                              console.log("in else if... probabily last time");
                                              fileSystem.close(tempFileDescForInter, function(err){
                                                   if (err){
                                                      console.log(err);
                                                   }
                                                   console.log("File closed successfully.");
                                                });
                                              generateDistractors('./tempFileToStoreIntermediary.json',topicIds,poolOfAllUniqueAnswers,res,tempFileDescForStore);
                                            }
                                        });




                                });
                        } else {
                            generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,objectToContainIfPopularOrNot, imageArray,questionStub,tempFileDescForInter)
                                .then(function(resultsArray) {
                                  console.log(resultsArray);

                                  if (endIndex < numberOfQuestions) {
                                      startIndex += numberOfRecordsToBeProcessed;
                                      endIndex = startIndex + numberOfRecordsToBeProcessed;
                                      if (endIndex > numberOfQuestions) {
                                          endIndex = numberOfQuestions;
                                          aRecursiveFunctionForSendingRequest(wholePageAsObject, pIdForOpt, startIndex, endIndex);
                                      }
                                      else if (endIndex < numberOfQuestions) {
                                        aRecursiveFunctionForSendingRequest(wholePageAsObject, pIdForOpt, startIndex, endIndex);
                                      }
                                      else if (endIndex === numberOfQuestions) {
                                        aRecursiveFunctionForSendingRequest(wholePageAsObject, pIdForOpt, startIndex, endIndex);

                                      }
                                  }
                                  else if (endIndex === numberOfQuestions) {
                                    fileSystem.close(tempFileDescForInter, function(err){
                                         if (err){
                                            console.log(err);
                                         }
                                         console.log("File closed successfully.");
                                      });
                                    generateDistractors('./tempFileToStoreIntermediary.json',topicIds,poolOfAllUniqueAnswers,res,tempFileDescForStore);
                                  }
                                });
                        }




                    });
            }


        }
    });
}




function getDescriptionForEachEntity(arrayOfUri, pIdForOpt) {
    console.log("request recieved");
    console.log(arrayOfUri);
    var deferred = Promise.defer();
    var arrayOfRequestsToBePromised = [];
    var arrayOfObjectsForEachEntity = [];
    var objectToContainVariableAndAnswer = {};
    var objectToContainIfPopularOrNot={};
    var isPopular="Relatively Lesser Known";
    var dataType;
    var imageArray = {};
    pIdForOpt = 'P' + pIdForOpt;
    console.log(pIdForOpt);



    for (var i = 0; i < arrayOfUri.length; i++) {
        arrayOfRequestsToBePromised.push(rp(arrayOfUri[i])
            .then(function(body) {
                var obj = JSON.parse(body);
                arrayOfObjectsForEachEntity.push(obj["entities"]);
            })
            .catch(function(err) {
                // Crawling failed...
            }));
    }

    console.log("before promise");
    Promise.all(arrayOfRequestsToBePromised).then(function() {
        console.log("Name LookUp Over");


        for (var i = 0; i < arrayOfObjectsForEachEntity.length; i++) {
            console.log(i);
            for (var firstTempVarForKeyRunover in arrayOfObjectsForEachEntity[i]) {
                if (arrayOfObjectsForEachEntity[i].hasOwnProperty(firstTempVarForKeyRunover)) {
                  var popularityIndex=Object.keys(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]).length
                                      +Object.keys(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["aliases"]).length;
                  if (popularityIndex<=7) {
                    isPopular="Relatively Lesser Known";
                  }
                  else if (popularityIndex>7 && popularityIndex<=14 ){
                    isPopular="Relatively Known";
                  }
                  else if (popularityIndex>14 && popularityIndex<=21) {
                    isPopular="Well Known";
                  }
                  else if (popularityIndex>21 && popularityIndex<=28) {
                    isPopular="Pretty Well Known";
                  }
                  else {
                    isPopular="Awesomely Well Known";
                  }
                    if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"][pIdForOpt] !== undefined) {
                        var tempStorageForData = arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"][pIdForOpt];
                        var tempStorageForAnswers = [];

                        for (var j = 0; j < tempStorageForData.length; j++) {

                            dataType = tempStorageForData[j]["mainsnak"]["datatype"];
                            if (tempStorageForData[j]["mainsnak"]["datavalue"] !== undefined) {


                                if (dataType === "url" || dataType === "string") {
                                    tempStorageForAnswers[j] = tempStorageForData[j]["mainsnak"]["datavalue"]["value"];
                                } else if (dataType === "commonsMedia") {
                                    var uriOfImage = generateImageUrl(tempStorageForData[j]["mainsnak"]["datavalue"]["value"].replace(/ /g, "_"));
                                    tempStorageForAnswers[j] = '<img src="' + uriOfImage + '" alt="' + uriOfImage + '" height="42" width="42">';
                                } else if (dataType === "wikibase-item") {
                                    tempStorageForAnswers[j] = tempStorageForData[j]["mainsnak"]["datavalue"]["value"]["numeric-id"];
                                } else if (dataType === "time") {
                                    tempStorageForAnswers[j] = tempStorageForData[j]["mainsnak"]["datavalue"]["value"]["time"];

                                }

                                // if more than one correct answer but there is some condition associated with it.. pick up the first one.
                                if (tempStorageForData.length > 1 && tempStorageForData[j]["qualifiers"] !== undefined) {
                                    j = tempStorageForData.length + 1;
                                }
                            }
                        }
                        if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"] !== undefined) {
                            if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"] !== undefined) {
                                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"]["value"]] = tempStorageForAnswers;
                                objectToContainIfPopularOrNot[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"]["value"]]=isPopular;
                                if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined) {
                                    imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"]["value"]] = arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"];

                                } else {
                                    imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["en"]["value"]] = "";
                                }
                            } else if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"] !== undefined) {
                                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]] = tempStorageForAnswers;
                                objectToContainIfPopularOrNot[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]]=isPopular;


                                if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined) {
                                    imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]] = arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"];
                                } else {
                                    imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]] = "";
                                }


                            } else {
                                var labelsAvailable = Object.keys(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]);
                                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]] = tempStorageForAnswers;
                                objectToContainIfPopularOrNot[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]]=isPopular;

                                if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined) {
                                    imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]] = arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"];

                                } else {
                                    imageArray[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]] = "";
                                }
                            }
                        } else {}

                    }
                }
            }
        }
        var resultsArray = [];
        resultsArray[0] = objectToContainVariableAndAnswer;
        resultsArray[1] = imageArray;
        resultsArray[2] = dataType;
        resultsArray[3]=objectToContainIfPopularOrNot;
        deferred.resolve(resultsArray);
        console.log("after promise");
    });

    return deferred.promise;
}



function getNameForOptionPid(objectToContainVariableAndAnswer, imageArray) {
    console.log(" request recieved in getNameForOptionPid");
    // console.log(objectToContainVariableAndAnswer);

    var deferred = Promise.defer();
    var searchUri;
    var arrayOfObjectsForEachEntity = [];
    var arrayOfRequestsToBePromised = [];
    var eachEntityName = {};

    for (var firstTempVarForKeyRunover in objectToContainVariableAndAnswer) {
        if (objectToContainVariableAndAnswer.hasOwnProperty(firstTempVarForKeyRunover)) {
            for (var i = 0; i < objectToContainVariableAndAnswer[firstTempVarForKeyRunover].length; i++) {
                searchUri = 'https://www.wikidata.org/wiki/Special:EntityData/Q' + objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i] + '.json'

                // get data from redis here...
                // client.get(objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i], function(err, reply) {
                //   console.log(reply);
                //  if (reply!=="") {
                //    objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]=reply;
                //  }
                    // else {
                      arrayOfRequestsToBePromised.push(rp(searchUri)
                          .then(function(body) {
                              var obj = JSON.parse(body);
                              arrayOfObjectsForEachEntity.push(obj);
                          })
                          .catch(function(err) {
                              // Crawling failed...
                          }));
                    // }
                // });

                // console.log('Q'+objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]);

            }
        }
    }
    Promise.all(arrayOfRequestsToBePromised).then(function() {
        console.log("Promises Done");
        for (var i = 0; i < arrayOfObjectsForEachEntity.length; i++) {
            var key = Object.keys(arrayOfObjectsForEachEntity[i]["entities"]);
            if (arrayOfObjectsForEachEntity[i]["entities"][key]["labels"] !== undefined) {
                if (arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["en"] !== undefined) {
                    eachEntityName[key] = arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["en"]["value"];
                } else if (arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["es"] !== undefined) {
                    eachEntityName[key] = arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]["es"]["value"];
                } else {
                    var labelsAvailable = Object.keys(arrayOfObjectsForEachEntity[i]["entities"][key]["labels"]);
                    eachEntityName[key] = arrayOfObjectsForEachEntity[i]["entities"][key]["labels"][labelsAvailable[0]]["value"];
                }
            }
        }

        for (var firstTempVarForKeyRunover in objectToContainVariableAndAnswer) {
            if (objectToContainVariableAndAnswer.hasOwnProperty(firstTempVarForKeyRunover)) {
                for (var i = 0; i < objectToContainVariableAndAnswer[firstTempVarForKeyRunover].length; i++) {
                    // client.set(objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i],eachEntityName['Q' + objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]], function(err, reply) {
                    //     console.log(reply);
                    //   });
                    objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i] = eachEntityName['Q' + objectToContainVariableAndAnswer[firstTempVarForKeyRunover][i]];
                }
            }
        }
        deferred.resolve(objectToContainVariableAndAnswer);
    });
    return deferred.promise;
}


function generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,objectToContainIfPopularOrNot, imageArray, questionStub,tempFileDescForInter) {
    var deferred = Promise.defer();

    console.log("in generate questions function");

    var counterForQuesArray = 0;
    var imageLinks = generateArrayofImageUrl(imageArray);
    var arrayForQuestionData = [];
    for (var firstTempVarForKeyRunover in objectToContainVariableAndAnswer) {
        if (objectToContainVariableAndAnswer.hasOwnProperty(firstTempVarForKeyRunover)) {
            var tempObjForQuesAndAns = {};
            tempObjForQuesAndAns["question"] = questionStub["pre"] + firstTempVarForKeyRunover + questionStub["post"];
            tempObjForQuesAndAns["answer"] = objectToContainVariableAndAnswer[firstTempVarForKeyRunover];
            tempObjForQuesAndAns["image"] = imageLinks[firstTempVarForKeyRunover];
            tempObjForQuesAndAns["popularityDesc"]=objectToContainIfPopularOrNot[firstTempVarForKeyRunover];
            arrayForQuestionData[counterForQuesArray] = tempObjForQuesAndAns;
            counterForQuesArray++;
        }

    }
    for (var i = 0; i < arrayForQuestionData.length; i++) {
        for (var j = 0; j < arrayForQuestionData[i]["answer"].length; j++) {
            if (poolOfAllUniqueAnswers.indexOf(arrayForQuestionData[i]["answer"][j]) == -1) {
                poolOfAllUniqueAnswers.push(arrayForQuestionData[i]["answer"][j]);
            }
        }
    }

    fileSystem.appendFile(tempFileDescForInter, JSON.stringify(arrayForQuestionData) + '\n', encoding = 'utf8', function(err) {
        if (err) throw err;
        deferred.resolve("successfully written in file");
        console.log(arrayForQuestionData);
    });


    return deferred.promise;

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
               arrayOfImageUrl[firstTempVarForKeyRunover] = ""; // set the array element as image not found
              // do nothing
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




   function generateDistractors(fileLocation,topicIds,poolOfAllUniqueAnswers,res,tempFileDescForStore){
     var arrayOfObjsQuesAndDistractor=[];
     var counterForQuesArray=0;

     console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
     console.log(poolOfAllUniqueAnswers);
     console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");

     var lr = new LineByLineReader(fileLocation);

     lr.on('error', function (err) {
   	   // 'err' contains error object
      });

      lr.on('line', function (line) {
       //  console.log(++counterForQuesArray);
       //  console.log(line);
   	    // 'line' contains the current line without the trailing newline character.
        //  console.log(line);
         arrayForQuestionData=JSON.parse(line);
        //  console.log(arrayForQuestionData);
        //  console.log(arrayForQuestionData[0]);
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
               console.log(arrayForQuestionData[i]["question"]);
               // console.log(slug(arrayForQuestionData[i]["question"]));
               // console.log(MD5(slug(arrayForQuestionData[i]["question"])));


               var correctIndex=Math.floor(Math.random() * numberOfOptionsToBeGenerated);
               console.log("correctIndex " + correctIndex);
               console.log("distractor " + distractor);
               console.log("answer " + arrayForQuestionData[i]["answer"][j]);
               tempObjToStoreQueAnsDis["questionId"]=MD5(slug(arrayForQuestionData[i]["question"]));
               tempObjToStoreQueAnsDis["question"]=arrayForQuestionData[i]["question"];
               tempObjToStoreQueAnsDis["image"]=arrayForQuestionData[i]["image"];
               // tempObjToStoreQueAnsDis["answer"]=arrayForQuestionData[i]["answer"][j];
               // tempObjToStoreQueAnsDis["distractor"]=distractor;
               tempObjToStoreQueAnsDis["topicId"]=topicIds;
               // tempObjToStoreQueAnsDis["topicIds"]=['T1','T2'];
               tempObjToStoreQueAnsDis["options"]=[];
               for (var l = 0,m=0; l <= distractor.length; l++) {
                 if (l !== correctIndex) {
                   tempObjToStoreQueAnsDis["options"][l]=distractor[m];
                   m++;
                 }
                 else {
                   tempObjToStoreQueAnsDis["options"][l]=arrayForQuestionData[i]["answer"][j];
                 }
               }
               tempObjToStoreQueAnsDis["correctIndex"]=correctIndex;

               if (!ifAllHasBeenRequested) {
                 tempObjToStoreQueAnsDis["popularityDesc"]=arrayForQuestionData[i]["popularityDesc"];
                 arrayOfObjsQuesAndDistractor[counterForQuesArray++]=tempObjToStoreQueAnsDis;
               }
               console.log("##########################################################");
               console.log(tempObjToStoreQueAnsDis);

               fileSystem.appendFile(tempFileDescForStore, JSON.stringify(tempObjToStoreQueAnsDis) + '\n', encoding='utf8', function (err) {
                   if (err) throw err;
               });
               numberOfQuestionsPrepared++;

               // write into file here...

             }
           }
       });

       lr.on('end', function () {
         console.log("all done");
   	     // All lines are read, file is closed now.
         fileSystem.close(tempFileDescForStore, function(err){
              if (err){
                 console.log(err);
              }
             //  console.log("File closed successfully.");
           });

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
        });
     //


     }


     function getARandonAnsweFromPoolOfAns(poolOfAllUniqueAnswers){
       var randomIndex = Math.floor(Math.random() * poolOfAllUniqueAnswers.length);
       return(poolOfAllUniqueAnswers[randomIndex]);
     }
