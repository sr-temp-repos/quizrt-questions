var express = require('express');
var router = express.Router();
//Load the request module
var request = require('request');
var Promise = require("bluebird");
var rp = require('request-promise');

var totalNumberOfRequestsCompleted=0;
var totalNumberOfRequestsNeedToBeMade=0;
var dataToBeAnalyzedForRelevance={};


/* GET home page. */
router.post('/', function(req, res, next) {

  var searchString=req.body.data[0];
  var exclusionList=req.body.data[1];

  var searchUri='https://www.wikidata.org/wiki/Special:EntityData/'+searchString+'.json';
  request(searchUri, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var description=dataToBeAnalyzedForRelevance["description"]=getDescription(body,searchString);
      var fullData=dataToBeAnalyzedForRelevance["fullData"]=processEntityData(body,searchString);
      var onlyPandQ=dataToBeAnalyzedForRelevance["onlyPandQ"]=processFullData(fullData);
      processOnlyPandQ(onlyPandQ,exclusionList,res);

    }
});

});

function getDescription(data,searchString){

  var obj = JSON.parse(data);
  var description=obj["entities"][searchString]["descriptions"]["en"]["value"];

  return description;
}


function processEntityData(data,searchString){
  var obj = JSON.parse(data);
  var claims=obj["entities"][searchString]["claims"];
  var objToBeReturned={};
  for (var firstTempVarForKeyRunover in claims) {
  if (claims.hasOwnProperty(firstTempVarForKeyRunover)) {
    tempStorageForClaimsObj=claims[firstTempVarForKeyRunover];
    var counterforTempArray=0;
    var tempArrayToStoreMultipleObjects=[];
     for (var secondTempVarForKeyRunover in tempStorageForClaimsObj) {
       if (tempStorageForClaimsObj.hasOwnProperty(secondTempVarForKeyRunover)) {
         if(tempStorageForClaimsObj[secondTempVarForKeyRunover]["mainsnak"]["datavalue"] !== undefined){
         tempArrayToStoreMultipleObjects[counterforTempArray++]=
         tempStorageForClaimsObj[secondTempVarForKeyRunover]["mainsnak"]["datavalue"]["value"];
       }
       }
     }
     objToBeReturned[firstTempVarForKeyRunover]=tempArrayToStoreMultipleObjects;

  }

}
// console.log(objToBeReturned);
  return objToBeReturned;

}


function processFullData(fullData) {
  var objToBeReturned={};


  for (var firstTempVarForKeyRunover in fullData) {
    if (fullData.hasOwnProperty(firstTempVarForKeyRunover)) {
      var tempArrayToStoreMultipleObjects=[];
      totalNumberOfRequestsNeedToBeMade++;
      for (var i = 0; i < fullData[firstTempVarForKeyRunover].length; i++) {
        if(fullData[firstTempVarForKeyRunover][i]["numeric-id"] !== undefined){
          totalNumberOfRequestsNeedToBeMade++;
          tempArrayToStoreMultipleObjects[i]=fullData[firstTempVarForKeyRunover][i]["numeric-id"];
        }
        else{
          totalNumberOfRequestsNeedToBeMade--;
        }
      }

    }
    if (tempArrayToStoreMultipleObjects.length > 0) {
      objToBeReturned[firstTempVarForKeyRunover]=tempArrayToStoreMultipleObjects;
    }
  }
  return objToBeReturned;
}

function processOnlyPandQ(onlyPandQ,exclusionList,res){

  var tempObjForItemAndString={};
  var replacePandQWithStringsFucntionNotCalled=true;
  var flatOnlyPandQ=[];
  var arrayOfRequestsToBeMadeToWikidata=[];
  var arrayOfRequestsToBePromised=[];
  // console.log(totalNumberOfRequestsNeedToBeMade);
  // console.log(totalNumberOfRequestsCompleted);
  var indexForFlatOnlyPandQ=0;

  for (var firstTempVarForKeyRunover in onlyPandQ) {
    if (onlyPandQ.hasOwnProperty(firstTempVarForKeyRunover)) {
      flatOnlyPandQ[indexForFlatOnlyPandQ]=firstTempVarForKeyRunover;
      arrayOfRequestsToBeMadeToWikidata[indexForFlatOnlyPandQ]=
                                                              'https://www.wikidata.org/wiki/Special:EntityData/'+
                                                              flatOnlyPandQ[indexForFlatOnlyPandQ]+
                                                              '.json';
      indexForFlatOnlyPandQ++;
      for (var i = 0; i < onlyPandQ[firstTempVarForKeyRunover].length; i++) {
        flatOnlyPandQ[indexForFlatOnlyPandQ]='Q'+onlyPandQ[firstTempVarForKeyRunover][i];
        arrayOfRequestsToBeMadeToWikidata[indexForFlatOnlyPandQ]=
                                                                'https://www.wikidata.org/wiki/Special:EntityData/'+
                                                                flatOnlyPandQ[indexForFlatOnlyPandQ]+
                                                                '.json';
        indexForFlatOnlyPandQ++;
      }
    }
  }
  // console.log(arrayOfRequestsToBeMadeToWikidata);
  for (var i = 0; i < arrayOfRequestsToBeMadeToWikidata.length; i++) {

    arrayOfRequestsToBePromised.push(rp(arrayOfRequestsToBeMadeToWikidata[i])
      .then(function (body) {
          // Process html...
          // console.log("Inside requests");
                    var obj = JSON.parse(body);
                    var entityId;
                    for (var secondTempVarForKeyRunover in obj["entities"]) {
                      if (obj["entities"].hasOwnProperty(secondTempVarForKeyRunover)) {
                        entityId=secondTempVarForKeyRunover;
                      }
                    }
                    tempObjForItemAndString[entityId]=obj["entities"][entityId]["labels"]["en"]["value"];
                    // console.log(entityId+":"+obj["entities"][entityId]["labels"]["en"]["value"]);
      })
      .catch(function (err) {
          // Crawling failed...
      }));
  }

  // console.log(arrayOfRequestsToBePromised);


  Promise.all(arrayOfRequestsToBePromised).then(function() {
    // console.log("all requests were done");
    dataToBeAnalyzedForRelevance["pAndQStringified"]=replacePandQWithStrings(tempObjForItemAndString,onlyPandQ);
    // console.log(dataToBeAnalyzedForRelevance);
    // res.send(dataToBeAnalyzedForRelevance);
    analyzeEntityAndReturnMostRelevantFields(dataToBeAnalyzedForRelevance,exclusionList,res);
});


  }



function replacePandQWithStrings(tempObjForItemAndString,onlyPandQ){
  // console.log("replacePandQWithStrings");
  var pAndQStringified={};
  var anotherCopyOfOnlyPandQ;

  anotherCopyOfOnlyPandQ=onlyPandQ;

  for (var firstTempVarForKeyRunover in onlyPandQ) {
    var tempArrayToStoreMultipleObjects=[];

    if (onlyPandQ.hasOwnProperty(firstTempVarForKeyRunover)) {
      // console.log(firstTempVarForKeyRunover);
      // console.log(tempObjForItemAndString[firstTempVarForKeyRunover]);

      for (var i = 0; i < onlyPandQ[firstTempVarForKeyRunover].length; i++) {
        tempArrayToStoreMultipleObjects[i]=
        tempObjForItemAndString['Q'+onlyPandQ[firstTempVarForKeyRunover][i]];
        // console.log('Q'+onlyPandQ[firstTempVarForKeyRunover][i]);
        // console.log(tempObjForItemAndString['Q'+onlyPandQ[firstTempVarForKeyRunover][i]]);
      }
      pAndQStringified[tempObjForItemAndString[firstTempVarForKeyRunover]]=tempArrayToStoreMultipleObjects;

    }
  }
  // console.log(onlyPandQ);
  // console.log(pAndQStringified);
  return pAndQStringified;
}

function analyzeEntityAndReturnMostRelevantFields(dataToBeAnalyzedForRelevance,exclusionList,res){
  var description=filterDescription(dataToBeAnalyzedForRelevance["description"],exclusionList);
  console.log(description);
  var stringContainingAllDetails=dataToBeAnalyzedForRelevance["pAndQStringified"];
  var onlyPandQ=dataToBeAnalyzedForRelevance["onlyPandQ"];

  var arrayOfObjForRelevantFields={};
  var arrayOfObjForRelevantFieldsReverseLookup={};
  // console.log(description);
  // console.log(stringContainingAllDetails);

  var tempStorageForKeys=Object.keys(onlyPandQ);
  var counterForIteratingOverOnlyPandQ=-1;
  var counterForStoringInArrayOfObj=0;
  var counterForStoringInArrayOfObjReverse=0;
  var boolForStatusForSearch=false;
  var tempStorageForInstanceOf={};

  console.log(stringContainingAllDetails);
  for (var firstTempVarForKeyRunover in stringContainingAllDetails) {
    if(stringContainingAllDetails.hasOwnProperty(firstTempVarForKeyRunover)){
      counterForIteratingOverOnlyPandQ++;
      for (var i = 0; i < description.length; i++) {
        for (var j = 0; j < stringContainingAllDetails[firstTempVarForKeyRunover].length; j++) {
          // console.log(stringContainingAllDetails[firstTempVarForKeyRunover][j]+" == "+description[i]);
          if(stringContainingAllDetails[firstTempVarForKeyRunover][j] !== undefined){
          if(stringContainingAllDetails[firstTempVarForKeyRunover][j].indexOf(description[i]) > -1){
            boolForStatusForSearch=true;
            var tempObjForPQAndString={};
            var qNum='Q'+onlyPandQ[tempStorageForKeys[counterForIteratingOverOnlyPandQ]][j];

            tempObjForPQAndString["pNum"]=
                              tempStorageForKeys[counterForIteratingOverOnlyPandQ];
            tempObjForPQAndString["pString"]=
                              firstTempVarForKeyRunover;
            tempObjForPQAndString["qString"]=
                              stringContainingAllDetails[firstTempVarForKeyRunover][j];

            arrayOfObjForRelevantFields[qNum]=tempObjForPQAndString;

            counterForStoringInArrayOfObj++;

          }
          else if(description[i].indexOf(stringContainingAllDetails[firstTempVarForKeyRunover][j]) > -1){

            var tempObjForPQAndString={};
            var qNum='Q'+onlyPandQ[tempStorageForKeys[counterForIteratingOverOnlyPandQ]][j];


            tempObjForPQAndString["pNum"]=
                              tempStorageForKeys[counterForIteratingOverOnlyPandQ];
            tempObjForPQAndString["pString"]=
                              firstTempVarForKeyRunover;
            tempObjForPQAndString["qString"]=
                              stringContainingAllDetails[firstTempVarForKeyRunover][j];

            arrayOfObjForRelevantFieldsReverseLookup[qNum]=tempObjForPQAndString;
            counterForStoringInArrayOfObjReverse++;
          }
          else if (tempStorageForKeys[counterForIteratingOverOnlyPandQ] === "P31") {
            tempStorageForInstanceOf["pNum"]=
                              tempStorageForKeys[counterForIteratingOverOnlyPandQ];
            tempStorageForInstanceOf["qNum"]=
                              onlyPandQ[tempStorageForKeys[counterForIteratingOverOnlyPandQ]][j];
            tempStorageForInstanceOf["pString"]=
                              firstTempVarForKeyRunover;
            tempStorageForInstanceOf["qString"]=
                              stringContainingAllDetails[firstTempVarForKeyRunover][j];
          }
        }
      }
      }
    }
  }

  if (boolForStatusForSearch) {
    arrayOfObjForRelevantFields['Q'+tempStorageForInstanceOf["qNum"]]=tempStorageForInstanceOf;
    console.log("Yahoo.. Match Found!!" );
    console.log(arrayOfObjForRelevantFields);
    res.send(arrayOfObjForRelevantFields);


  }
  else {
    arrayOfObjForRelevantFieldsReverseLookup[tempStorageForInstanceOf["qNum"]]=tempStorageForInstanceOf;
    console.log("Yahoo..Reverse Match Found!!" );
    console.log(arrayOfObjForRelevantFieldsReverseLookup);
    res.send(arrayOfObjForRelevantFieldsReverseLookup);
  }


}

function filterDescription(description,exclusionList){
  var questionSplittedIntoWords=description.replace(',','').split(' ');
  return questionSplittedIntoWords.filter(function (eachWord) {
      return exclusionList.indexOf(eachWord.toLowerCase()) === -1;
    });
}


module.exports = router;
