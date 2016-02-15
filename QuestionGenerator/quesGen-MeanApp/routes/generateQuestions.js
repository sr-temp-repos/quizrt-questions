var express = require('express');
var router = express.Router();
//Load the request module
var request = require('request');
var Promise = require("bluebird");
var rp = require('request-promise');

var numberOfQuestionsCreated;
/* GET home page. */
router.post('/', function(req, res, next) {

  var pIdForVar=req.body.data[0].split('P');
  var qIdForVar=req.body.data[1].split('Q');
  var pIdForOpt=req.body.data[2].split('P');
  var questionStub=req.body.data[3];

  var searchUri="http://wdq.wmflabs.org/api?q=claim["+pIdForVar[1]+":"+qIdForVar[1]+"] and claim["+pIdForOpt[1]+"]";
  // console.log(searchUri);
  request(searchUri, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var wholePageAsObject = JSON.parse(body);
      numberOfQuestionsCreated=wholePageAsObject["items"].length;
      var arrayOfUri=[];
      // console.log(numberOfQuestionsCreated);
      // console.log(searchUri);
      for (var i = 0; i < 200; i++) { //set 200 as limit here...
        arrayOfUri.push('https://www.wikidata.org/wiki/Special:EntityData/Q'+wholePageAsObject["items"][i]+'.json');
      }

      // console.log("Number of questions generated " + numberOfQuestionsCreated);
      getDescriptionForEachEntity(arrayOfUri,pIdForOpt[1],res,questionStub);
    }
    // console.log(arrayOfRequestsToBePromised);

});



});

function getDescriptionForEachEntity(arrayOfUri,pIdForOpt,res,questionStub){
  // console.log("arrayOfUri");
  // console.log(arrayOfUri);
var arrayOfRequestsToBePromised=[];
var arrayOfObjectsForEachEntity=[];
var objectToContainVariableAndAnswer={};
var dataType;
var imageArray=[];
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
    // res.send(arrayOfObjectsForEachEntity);
    for (var i = 0; i < arrayOfObjectsForEachEntity.length; i++) {
      for (var firstTempVarForKeyRunover in arrayOfObjectsForEachEntity[i]) {
        if (arrayOfObjectsForEachEntity[i].hasOwnProperty(firstTempVarForKeyRunover)) {
          // console.log(firstTempVarForKeyRunover);
          if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"][pIdForOpt] !== undefined){
            var tempStorageForData=arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"][pIdForOpt];
            var tempStorageForAnswers=[];

            if(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"] !== undefined){
              imageArray.push(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]);
            }
            else {
              imageArray.push("");
            }


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
              }
              else if (arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"] !== undefined) {
                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]["es"]["value"]]=tempStorageForAnswers;
              }
              else {
                var labelsAvailable=Object.keys(arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"]);
                // console.log(labelsAvailable);
                objectToContainVariableAndAnswer[arrayOfObjectsForEachEntity[i][firstTempVarForKeyRunover]["labels"][labelsAvailable[0]]["value"]]=tempStorageForAnswers;

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

    if(dataType==="wikibase-item"){
      getNameForOptionPid(objectToContainVariableAndAnswer,imageArray,questionStub,res);

    }
    else {
      generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,imageArray,questionStub,res);
    }
    // console.log(objectToContainVariableAndAnswer);

    // res.send(arrayOfObjectsForEachEntity);

  });

}

function getNameForOptionPid(objectToContainVariableAndAnswer,imageArray,questionStub,res){
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
      generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,imageArray,questionStub,res)

    });

}

function generateQuestionsJsonToBeSentBackToClient(objectToContainVariableAndAnswer,imageArray,questionStub,res){
  console.log("in generate questions function");
  var counterForImageArray=0;
  var counterForQuesArray=0;
  var imageLinks=generateArrayofImageUrl(imageArray);
  var arrayForQuestionData=[];
  // console.log(objectToContainVariableAndAnswer);
  for (var firstTempVarForKeyRunover in objectToContainVariableAndAnswer) {
    if(objectToContainVariableAndAnswer.hasOwnProperty(firstTempVarForKeyRunover)){
      // for (var i = 0; i < objectToContainVariableAndAnswer[firstTempVarForKeyRunover].length; i++) {
        var tempObjForQuesAndAns={};
        tempObjForQuesAndAns["question"]=questionStub["pre"]+firstTempVarForKeyRunover+questionStub["post"];
        tempObjForQuesAndAns["answer"]=objectToContainVariableAndAnswer[firstTempVarForKeyRunover];
        tempObjForQuesAndAns["imageUri"]=imageLinks[counterForImageArray];
        arrayForQuestionData[counterForQuesArray]=tempObjForQuesAndAns;
        counterForQuesArray++;
      // }
      counterForImageArray++;

    }

  }
  // console.log(arrayForQuestionData);
  generateDistractors(arrayForQuestionData,res);
  // res.send(arrayForQuestionData);
  // console.log(allCorrectAnswers);
}


function generateDistractors(arrayForQuestionData,res){
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


  for (var i = 0; i < arrayForQuestionData.length; i++) {
    for (var j = 0; j < arrayForQuestionData[i]["answer"].length; j++) {
      var tempObjToStoreQueAnsDis={};
      var distractor=[];
      for (var k = 0; k < 3; k++) {
          var potentailDistractor=getARandonAnsweFromPoolOfAns(poolOfAllUniqueAnswers);
          if(arrayForQuestionData[i]["answer"].indexOf(potentailDistractor) == -1 && distractor.indexOf(potentailDistractor)==-1){
            distractor.push(potentailDistractor);
          }
          else {
            k--;
          }
        }

        tempObjToStoreQueAnsDis["question"]=arrayForQuestionData[i]["question"];
        tempObjToStoreQueAnsDis["answer"]=arrayForQuestionData[i]["answer"][j];
        tempObjToStoreQueAnsDis["imageUri"]=arrayForQuestionData[i]["imageUri"];
        tempObjToStoreQueAnsDis["distractor"]=distractor;

        arrayOfObjsQuesAndDistractor[counterForQuesArray++]=tempObjToStoreQueAnsDis;
      }
    }
    arrayOfObjsQuesAndDistractor[counterForQuesArray]=numberOfQuestionsCreated;

    console.log(arrayOfObjsQuesAndDistractor);
    res.send(arrayOfObjsQuesAndDistractor);

  }

  function getARandonAnsweFromPoolOfAns(poolOfAllUniqueAnswers){
    var randomIndex = Math.floor(Math.random() * poolOfAllUniqueAnswers.length);
    return(poolOfAllUniqueAnswers[randomIndex]);
  }







function generateArrayofImageUrl(arrayOfImageUrlFromWiki) { // function to generate final Image Url from Image Text of Wikidata
       var arrayOfImageUrl = []; // array to be returned .. it will contain url of the image
       for (var i = 0; i < arrayOfImageUrlFromWiki.length; i++) { // iterate for each Image Text value picked from wikidata
           if (arrayOfImageUrlFromWiki[i] === "") { // if the image field was not found in wikidata for a perticular entity
               arrayOfImageUrl[i] = "No Image Available In Wikidata"; // set the array element as image not found
           } else {
               arrayOfImageUrl[i] = generateImageUrl(arrayOfImageUrlFromWiki[i].replace(/ /g,"_")); // else generateImageUrl
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


   function MD5(string) {

       function RotateLeft(lValue, iShiftBits) {
           return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
       }

       function AddUnsigned(lX, lY) {
           var lX4, lY4, lX8, lY8, lResult;
           lX8 = (lX & 0x80000000);
           lY8 = (lY & 0x80000000);
           lX4 = (lX & 0x40000000);
           lY4 = (lY & 0x40000000);
           lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
           if (lX4 & lY4) {
               return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
           }
           if (lX4 | lY4) {
               if (lResult & 0x40000000) {
                   return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
               } else {
                   return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
               }
           } else {
               return (lResult ^ lX8 ^ lY8);
           }
       }

       function F(x, y, z) {
           return (x & y) | ((~x) & z);
       }

       function G(x, y, z) {
           return (x & z) | (y & (~z));
       }

       function H(x, y, z) {
           return (x ^ y ^ z);
       }

       function I(x, y, z) {
           return (y ^ (x | (~z)));
       }

       function FF(a, b, c, d, x, s, ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
       };

       function GG(a, b, c, d, x, s, ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
       };

       function HH(a, b, c, d, x, s, ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
       };

       function II(a, b, c, d, x, s, ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
       };

       function ConvertToWordArray(string) {
           var lWordCount;
          var lMessageLength = string.length;
           var lNumberOfWords_temp1 = lMessageLength + 8;
           var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
           var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
           var lWordArray = Array(lNumberOfWords - 1);
           var lBytePosition = 0;
           var lByteCount = 0;
           while (lByteCount < lMessageLength) {
               lWordCount = (lByteCount - (lByteCount % 4)) / 4;
               lBytePosition = (lByteCount % 4) * 8;
               lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
               lByteCount++;
           }
           lWordCount = (lByteCount - (lByteCount % 4)) / 4;
           lBytePosition = (lByteCount % 4) * 8;
           lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
           lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
           lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
           return lWordArray;
       };

       function WordToHex(lValue) {
           var WordToHexValue = "",
               WordToHexValue_temp = "",
               lByte, lCount;
           for (lCount = 0; lCount <= 3; lCount++) {
               lByte = (lValue >>> (lCount * 8)) & 255;
               WordToHexValue_temp = "0" + lByte.toString(16);
               WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
           }
           return WordToHexValue;
       };

       function Utf8Encode(string) {
           string = string.replace(/\r\n/g, "\n");
           var utftext = "";

           for (var n = 0; n < string.length; n++) {

               var c = string.charCodeAt(n);

               if (c < 128) {
                   utftext += String.fromCharCode(c);
               } else if ((c > 127) && (c < 2048)) {
                   utftext += String.fromCharCode((c >> 6) | 192);
                   utftext += String.fromCharCode((c & 63) | 128);
               } else {
                   utftext += String.fromCharCode((c >> 12) | 224);
                   utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                   utftext += String.fromCharCode((c & 63) | 128);
               }

           }

           return utftext;
       };

       var x = Array();
       var k, AA, BB, CC, DD, a, b, c, d;
       var S11 = 7,
           S12 = 12,
           S13 = 17,
           S14 = 22;
       var S21 = 5,
           S22 = 9,
           S23 = 14,
           S24 = 20;
       var S31 = 4,
           S32 = 11,
           S33 = 16,
           S34 = 23;
       var S41 = 6,
           S42 = 10,
           S43 = 15,
           S44 = 21;

       string = Utf8Encode(string);

       x = ConvertToWordArray(string);

       a = 0x67452301;
       b = 0xEFCDAB89;
       c = 0x98BADCFE;
       d = 0x10325476;

       for (k = 0; k < x.length; k += 16) {
           AA = a;
           BB = b;
           CC = c;
           DD = d;
           a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
           d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
           c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
           b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
           a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
           d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
           c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
           b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
           a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
           d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
           c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
           b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
           a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
           d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
           c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
           b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
           a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
           d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
           c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
           b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
           a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
           d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
           c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
           b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
           a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
           d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
           c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
           b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
           a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
           d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
           c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
           b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
           a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
           d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
           c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
           b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
           a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
           d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
           c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
           b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
           a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
           d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
           c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
           b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
           a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
           d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
           c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
           b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
           a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
           d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
           c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
           b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
           a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
           d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
           c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
           b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
           a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
           d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
           c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
           b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
           a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
           d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
           c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
           b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
           a = AddUnsigned(a, AA);
           b = AddUnsigned(b, BB);
           c = AddUnsigned(c, CC);
           d = AddUnsigned(d, DD);
       }

       var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

       return temp.toLowerCase();
   }



module.exports = router;
