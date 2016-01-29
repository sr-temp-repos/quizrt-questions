(function() {
    var questionArray = [];
    var checkedProperties = [];
    var option;
    var propertyValueList = {};
    var getPropertyValueList = function(propertyName) {
        return propertyValueList[propertyName];
    };
    var resultUrl = 'http://wdq.wmflabs.org/api?q=';
    var qId;
    var qIdList = [];
    var optionData;
    var numberOfQuestionsGenrated; // variable to store number of questions Generated
    var exclusionList = ["", "what", "where", "who", "was", "which", "when", "whom", "who", "whose", "did", "how", "is", "in", "a", "an", "the", "?", "of", "from"];
    var tempArrayForWords = []; // to have words which are not there in exclusionList
    var questionData = {};
    var questionList = [];
    var imageList=[];

    $("#skipButton").on('click', function() { // skip button in the help displaying div
        $('#introDiv').slideUp('slow'); // slideUp the intro div
    });

    $("#needHelp").on('click', function() { // need help button... when clicked you get a screen with a series of instructions.
        $('#introDiv').slideDown('slow'); // slideDownthe intro div
        $("#introDivText").typed({ // a third party jquery which helps getting typing effect
            strings: ["Welcome To Project X . . .", " I Shall Help You Generate Questions",
                "You Shall Be Required To Key In One Sample Question",
                "E.G. Sample Question - Sachin Tendulkar is from which country ? ",
                "Once You Have Entered Sample Question.. I ll Ask you variable and option",
                "So, If  Sample Question is - Sachin Tendulkar is from which country ? Variable is - Sachin Tendulkar and Option Will Be - country ",
            ],
            typeSpeed: 100,
            cursorChar: "|"
        });
    });
    // needHelp

    function addCheckbox(questionArray) {

        for (var i = 0; i < questionArray.length; i++) {
            var container = $('#cbList');
            var inputs = container.find('input');
            var id = inputs.length;
            container.append($("<div class='checkbox'>")).append($('<input />', {
                type: 'checkbox',
                id: 'cb' + id,
                value: questionArray[i]
            }).addClass("col-lg-1")).append($('<label />', {
                'for': 'cb' + id,
                text: questionArray[i]
            }).addClass("col-lg-3 text-left"));
        }

        $("#checkBoxDiv").slideDown();
        return;
    }

    function addRadioButtons(questionArray) {
        $('#rdList').find("input").remove();
        $('#rdList').find("label").remove();
        for (var i = 0; i < questionArray.length; i++) {
            var container = $('#rdList');
            var inputs = container.find('input');
            var id = inputs.length;
            container.append($("<div class='radio'>")).append($('<input />', {
                type: 'radio',
                id: 'rd' + i,
                value: questionArray[i],
                name: "radioList"
            }).addClass("col-lg-1")).append($('<label />', {
                'for': 'rd' + i,
                text: questionArray[i]
            }).addClass("col-lg-3 text-left"));
        }

        return;
    }

    function getQuestionArray(sampleQuestion) {
        var questionArray = sampleQuestion.split(" ");
        if (questionArray.length < 3)
            alert("Enter at least 3 words!");
        else {
            return questionArray;
        }
    }

    function getSampleQuestion() { // first function to be excuted
        $("#sampleQuestion").on("keypress", function(e) { // enter key press event
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) { //Enter keycode.. when enter is pressed this becomes true
                executeOnGoOrEnter();
            }

        });
        $("#sampleQuestionButton").on("click", function() { // or if the user clicks on go..
            executeOnGoOrEnter();
        });

    }

    function executeOnGoOrEnter() {
        $('#cbList').find("input").remove();
        $('#cbList').find("label").remove();
        var sampleQuestion = $("#sampleQuestion").val();
        questionArray = getQuestionArray(sampleQuestion);
        // console.log(questionArray);
        for (var i = 0, j = 0; i < questionArray.length; i++) {
            if (exclusionList.indexOf(questionArray[i].toLowerCase()) == -1) { // exclude the words which are in exclusionList
                tempArrayForWords[j] = questionArray[i];
                j++;
            }
        }
        addCheckbox(tempArrayForWords);
        $("#resetPage").show();
        $("#resetPage").on("click", function() {
            location.reload();
        });
    }
    getSampleQuestion();

    function getVariableList() {
        $("#getVariableList").on("click", function() {
            // var arrayForOption=[];
            // var count=0;
            $("#checkBoxDiv").slideUp();
            $.each($("input[type='checkbox']:checked"), function() {
                for (var i = 0; i < questionArray.length; i++) {
                    if ($(this).val() == questionArray[i])
                        checkedProperties[i] = "Var";
                    else {
                        if (checkedProperties[i] != "Var") {
                            checkedProperties[i] = "Const";
                        }
                    }
                }
            });
            //       for(var j=0;j<checkedProperties.length;j++)
            //       if(checkedProperties[j]=="Const"){
            //       arrayForOption[count]=questionArray[j];
            //       count++;
            // }
            addRadioButtons(tempArrayForWords);
            $("#radioDiv").slideDown();
        });

    }
    getVariableList();

    var variableJson;

    function getEntityHints(item) {
        var count = 0;
        qIdList = [];
        var link = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + item + "&language=en&format=json";
        $("#spinner").show();
        $.getJSON(link + "&callback=?", function(data) {
            variableJson = data;
            count++;
            $('#entityOptions').find("li").remove();
            $.each(data["search"], function(k, v) {
                if (k == 0) {
                    qId = v["title"].substr(1);
                }
                $("#entity").show();
                $("#entityOptions").append($('<li>', {
                    value: k,
                    text: v["label"] + ":" + v["description"]
                }).addClass("list-group-item list-group-item-success btn").attr("id", k));
                qIdList.push(v["title"].substr(1));
            });
            $("#spinner").hide();
        });
    }

    function getVariableProperty(variableJson) {
        $("#spinner").show();

        $.each(variableJson["search"], function(k, v) {
            if (v["title"].substr(1) == qId) {

                tempDescription = v["description"].split(" ");
                for (var i = 0; i < tempDescription.length; i++) {
                    var container = $('#descriptionList');
                    var inputs = container.find('input');
                    var id = inputs.length;
                    container.append($("<div class='radio'>")).append($('<input />', {
                        type: 'radio',
                        id: 'dl' + i,
                        value: tempDescription[i].split(",")[0],
                        name: "descriptionList"
                    }).addClass("col-lg-1")).append($('<label />', {
                        'for': 'dl' + i,
                        text: tempDescription[i].split(",")[0]
                    }).addClass("col-lg-3 text-left"));
                }
            }
        });
        getEntityProperties(qId);
        $("#spinner").hide();

    }

    function getEntityProperties(qId) {

        var entityUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=Q" + qId + "&languages=en&format=json";
        // console.log("here@181"+entityUrl);
        $("#spinner").show();
        $.getJSON(entityUrl + "&callback=?", function(data) {

            $.each(data["entities"]["Q" + qId]["claims"], function(key, val) {
                var tempLink1 = "https://www.wikidata.org/wiki/Special:EntityData/" + key + ".json"
                $("#spinner").show();
                // console.log("here@188"+tempLink1);

                $.getJSON(tempLink1, function(data1) {
                    $.each(val, function(key1, val1) {
                        var numericID = val1["mainsnak"]["datavalue"]["value"]["numeric-id"];
                        if(numericID==null){
                          if(typeof(val1["mainsnak"]["datavalue"]["value"])=='object'){
                            propertyValueList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] = JSON.stringify(val1["mainsnak"]["datavalue"]["value"]);
                          }
                          else{
                            propertyValueList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] = val1["mainsnak"]["datavalue"]["value"];
                          }
                        }
                        var tempLink2 = "https://www.wikidata.org/wiki/Special:EntityData/Q" + numericID + ".json";
                        $('#entityPropertyList').find("li").remove();
                        $("#spinner").show();
                        // console.log("here@188"+tempLink2);

                        $.getJSON(tempLink2, function(data2) {
                            if (getPropertyValueList(data1["entities"][key]["labels"]["en"]["value"] + ":" + key) == null) {
                                propertyValueList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] = data2["entities"]["Q" + numericID]["labels"]["en"]["value"] + ":" + numericID;
                            } else {
                                if (propertyValueList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key].includes(data2["entities"]["Q" + numericID]["labels"]["en"]["value"] + ":" + numericID)) {

                                } else
                                    propertyValueList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] = propertyValueList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] + "," + data2["entities"]["Q" + numericID]["labels"]["en"]["value"] + ":" + numericID;
                                  console.log(propertyValueList);
                            }

                            $("#spinner").hide();

                        });
                    });
                    $("#spinner").hide();

                });
            });
            $("#spinner").hide();
        });

    }


    function getProperties(propertyNames) {
        //pIdList = [];
        var link = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + propertyNames + "&language=en&type=property&format=json";
        $("#spinner").show();
        $.getJSON(link + "&callback=?", function(data) {
            $('#propertyNames').find("li").remove();
            $.each(data["search"], function(k, v) {
                if (k == 0) {
                    pId = v["title"].substr(10);
                }
                $("#propertySuggestionRow").show();
                $("#propertyNames").append($('<li>', {
                    value: k,
                    text: v["label"] + ":" + v["description"].split(";")[0]
                }).addClass("list-group-item list-group-item-success btn").attr("id", k));
                //pIdList.push(v["title"].substr(10));

            });
            $("#spinner").hide();
        });
    }


    function getOption() {
        $("#getOption").on("click", function() {
            propertyValueList = {};
            $("#radioDiv").slideUp();
            // $("#descriptionListDiv").slideDown();
            option = $('input[type="radio"]:checked').attr('id').split("")[2];
            // console.log(option);
            getProperties(tempArrayForWords[option]);
            aggregatedResult = aggregateVarAndConst(questionArray, checkedProperties); // aggregate the data and varOrConst Parameter
            questionStub = generateQuestionStub(aggregatedResult, option); // generate dummy question stub json..
            getEntityHints(questionStub["Var"]);
        });

        $("#entityOptions").on("click", ".list-group-item", function() {
            $("#entity").slideUp(1000);
            $("#propertySuggestion").slideUp(1000);
            $("#descriptionListDiv").slideDown();

            qId = qIdList[$(this).val()];
            getVariableProperty(variableJson);
        });


        $("#propertyNames").on("click", ".list-group-item", function() {
            $("#propertySuggestion").slideUp(1000);
            // $("#propertyValueSuggestion").slideDown(4000);
            optionData = $(this).text().split(":")[0];
            // console.log(optionData);
            // pId = pIdList[$(this).val()];
            // getPropertyValues();
        });
    }
    getOption();

    var searchedData = {};

    function getData(propertyValueList, data) {
        searchedData = {};
        for (var key in propertyValueList) {
            if (propertyValueList.hasOwnProperty(key)) {
                if (key.includes(data) || propertyValueList[key].includes(data)) {
                    var temp = propertyValueList[key].split(",");
                    var newData;
                    if (key.includes(data)) {
                        newData = temp;
                    } else {
                        for (var i = 0; i < temp.length; i++) {
                            if (temp[i].includes(data))
                                newData = temp[i];
                        }
                    }
                    // console.log(key,newData);
                    searchedData[key] = newData;
                }
            }
        }

        return searchedData;
    }

    function getSelectedProperty() {
        $("#selected").on("click", function() {
            option = $('input[type="radio"][name="descriptionList"]:checked').val();

            var claimForVariablePart = getData(propertyValueList, option);
            // console.log(claimForVariablePart);
            var claimForOptionPart = getData(propertyValueList, optionData);

            generateQuestions(claimForVariablePart, claimForOptionPart, questionStub);
        });
    }
    getSelectedProperty();

    function generateQuestions(claimForVariablePart, claimForOptionPart, questionStub) {
        var pidForVariable, qidForVariable, pidForOption;

        for (var key in claimForVariablePart) {
            if (propertyValueList.hasOwnProperty(key)) {

                if(propertyValueList[key].split(":")[1]!==null){//-----changes for image-->
                  pidForVariable = key.split(":")[1];
                  qidForVariable = propertyValueList[key].split(":")[1];
                }
            }
        }

        for (var key in claimForOptionPart) {
            if (propertyValueList.hasOwnProperty(key)) {

                pidForOption = key.split(":")[1];
            }
        }
        getPropertyValueResult(pidForVariable, qidForVariable, pidForOption);
    }



    function getPropertyValueResult(pId, qId, pidForOption) {
        var claim = 'claim[' + pId.substr(1) + ':' + qId + "]";
        // $('#resultList').find("li").remove();
        resultUrl = resultUrl + claim + "%20AND%20";

        var tempURL = 'https://www.wikidata.org/wiki/Special:EntityData/Q';

        $("#spinner").show();

        // console.log("@346"+resultUrl);
        $.getJSON(resultUrl + "&callback=?", function(data) {
          var count=0;
            numberOfQuestionsGenrated = data["items"].length;
            $.each(data["items"], function(k, value) {
                if (k < 100) {
                    var link = tempURL + value + ".json";
                    $("#spinner").show();
                    $.getJSON(link, function(data) {
                        var name = data["entities"]["Q" + value]["labels"]["en"]["value"];
                        var temp = data["entities"]["Q" + value]["claims"][pidForOption];
                        //console.log(data);
                        $.each(temp, function(k, v) {
                            var temp2 = temp[0]["mainsnak"]["datavalue"]["value"]["numeric-id"]
                            var link2 = tempURL + temp[0]["mainsnak"]["datavalue"]["value"]["numeric-id"] + ".json";
                            $("#spinner").show();
                            $.getJSON(link2, function(data2) {
                                var name2 = data2["entities"]["Q" + temp2]["labels"]["en"]["value"];
                              //val1["mainsnak"]["datavalue"]["value"]["p18"]["mainsnak"]["datavalue"]["value"]
                                console.log(data2["entities"]["Q" + temp2]["labels"]["en"]["value"]);
                                //console.log(value);
                                //console.log(data["entities"]["Q" + value]["claims"]["P18"][0]);
                                if(data["entities"]["Q" + value]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]!=undefined)
                                // var image=data["entities"]["Q" + value]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"].replace("","_");
                                imageList.push(data["entities"]["Q" + value]["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"].replace(/ /g,"_"));
                                else{
                                  imageList.push("");
                                  // image="";
                                }

                                console.log(imageList);
                                questionData[name] = name2;
                                questionStub["Var"] = name;
                                questionStub["Option"] = name2;
                                questionList[count++] = questionStub["preConst"] + " " + questionStub["Var"] + " " + questionStub["postConst"] + " " + questionStub["Option"];
                                // console.log(count+"***"+questionList);
                                $("#spinner").hide();

                            });

                        });
                        $("#spinner").hide();

                    });
                }
            });
            $("#spinner").hide();

        });

        $("#loadQuestions").show();
        $("#selected").hide();


        $("#descriptionListDivInner").slideUp();

        $("#loadQuestions").on("click", function() {
            $('#questionList').find("li").remove();
            $('#questionListHeading').find("strong").remove();
            $('#questionListOptions').find("li").remove();

            var distractors = generateDistractors(questionList);
            var arrayOfImageUrl = generateArrayofImageUrl(imageList);
            console.log(arrayOfImageUrl);
            $("#questionListHeading").append($('<strong>', {
                text: "Number of Questions Generated " + numberOfQuestionsGenrated
            }));
            for (var i = 0; i < questionList.length; i++) {
                $("#showGeneratedQuestionsOuter").show();
                $("#questionList").append($('<li>', {
                    value: questionList[i].split("?")[0] + " ?",
                    html: (i + 1).toString().bold() + ") " + " " + questionList[i].split("?")[0] + " ?" + "<br>" + 'a)' + distractors[i][0].bold() + '    ' + " b) " + distractors[i][1] + " c) " + distractors[i][2] + " d) " + distractors[i][3] +
                    "<br>"+"<div class='imageForQuestion text-center'><div class='innerImageDiv'><img style='width:100%' align='middle' src="+arrayOfImageUrl[i]+"></img></div></div>"
                }).addClass("list-group-item"));
            }


            // console.log(distractors);
        });
    }


    function aggregateVarAndConst(arrayOfWords, varOrConst) { // function dat aggregates the variable and constant part together
        var aggregatedArray = [];
        var varOrConstForAggregatedArray = [];

        for (var i = 0, k = 0; i < varOrConst.length; i++, k++) { // run a loop thru the whole question given by user
            start = i; // start index of same type data either var / const
            end = i; // end index of same type data either var / const

            while (true) { // run infinitely untill you find a diffrent type ( var or const)...
                if (varOrConst[i] == varOrConst[i + 1]) {
                    end++;
                    i++;
                } else {
                    break;
                }
            } // end of while (true)
            for (var j = start; j <= end; j++) { // now we have start and end index of same type either var / const...
                if (aggregatedArray[k]) { // if something is there already in the word.. append
                    aggregatedArray[k] += " " + arrayOfWords[j];
                } else { // else initialize the word
                    aggregatedArray[k] = arrayOfWords[j];
                }
            }
            varOrConstForAggregatedArray[k] = varOrConst[i]; // assign the var or const parameter to the aggregated data
        }

        var result = [aggregatedArray, varOrConstForAggregatedArray]; // put both aggregated data and varOrConst parameter in an array

        return result; // return the result
    }


    function generateQuestionStub(aggregatedResult, optionIndex) { // accepts an array of array having two array... one for aggregated data
        // and one for var or const data for aggregated data
        // option index is the index of word which shall be made option
        aggregatedWords = aggregatedResult[0]; // 0th index contains an array of aggregated data
        aggregatedVarOrConstForWords = aggregatedResult[1]; // 1st index contains an array of var or const

        questionStub = {}; // initialize dummy question stub

        var pre = true;
        var post = true;
        for (var i = 0; i < aggregatedWords.length; i++) { // run through the aggregated data
            if (aggregatedVarOrConstForWords[i] == "Var") { // if variable.. add in var Part
                questionStub["Var"] = aggregatedWords[i];
                pre = false;
            } else if (pre) { // else add in const part
                questionStub["preConst"] = aggregatedWords[i];
            } else {
                questionStub["postConst"] = aggregatedWords[i];
            }
        }

        if (questionStub["preConst"] == undefined) {
            questionStub["preConst"] = "";
        }
        if (questionStub["postConst"] == undefined) {
            questionStub["postConst"] = "";
        }

        questionStub["Option"] = questionArray[optionIndex]; // add option to the option key of questionStub jSon

        return questionStub;
    }

    function generateDistractors(data) // it will generate 3 other distractor and will return an array with one correct answer and 3 wrong answer
    {
        // console.log("generateDistractors--begin");
        //data=[" Charlie Chaplin is from which country ? United Kingdom", " Tom Hanks is from which country ? United States of America", " John Lennon is from which country ? United Kingdom", " Stanley Kubrick is from which country ? United States of America", " Madonna is from which country ? United States of America"];

        var answers = []; // this array will gather all correct answers
        var distractors = []; // this array shall contain distractor
        // console.log(data);

        for (var i = 0; i < data.length; i++) { // loop to get all correct answers at one place
            answers[i] = (data[i].split("?"))[1]; // split by ? and get the answers
        } // end of loop to get all correct answers at one place

        // console.log(answers);
        // console.log(data.length);

        if (answers.length < 4) {
            return answers;
        }
        for (var i = 0; i < data.length; i++) { // loop to generate distractors
            // console.log("i=>"+i+"thresh "+data.length);
            var tempDistractor = []; // temp variable to hold distractor for each question

            tempDistractor[0] = answers[i]; // 0th index will always hold the correct answer

            for (var j = 1; j < 4; j++) { // 1st to 4th index will cntain the wrong answer
                // console.log("j=>"+j);
                tempDist = getRandomDistractor(answers, i); // generate a random number for accessing index of answers array

                if (tempDistractor.indexOf(answers[tempDist]) > -1) { // if the distractor array already contains the fetched random option
                    j--; // redo the loop ...
                } else { // else if the fecthed random option is new to the list...
                    tempDistractor[j] = answers[tempDist]; // write it in tempDistractor array..
                }
            } // end of loop for "1st to 4th index will cntain the wrong answer"
            distractors[i] = tempDistractor; // write tempDistractor array in distractors array.. distractors array will be returned...
        } // end of loop to generate distractors
        // console.log("generateDistractors--end");
        return distractors; // return the distractors

    } // end of function generateDistractors

    function getRandomDistractor(answers, currentIndex) { // function will accept all correct answers and currentIndex
        // it makes sure that it returns back only randomIndex != currentIndex
        var randomIndex; // local variable to store random index, this variable will be returned back...
        // console.log("infinite");

        while (true) { // run infinitely
            randomIndex = Math.floor(Math.random() * answers.length); // get a random index between 0 and length of array
            if (randomIndex != currentIndex) { // break loop and return on this if being true
                break;
            }
        }
        return randomIndex;
    } // end of function getRandomDistractor

    function generateArrayofImageUrl(arrayOfImageUrlFromWiki) { // function to generate final Image Url from Image Text of Wikidata
       var arrayOfImageUrl = []; // array to be returned .. it will contain url of the image
       for (var i = 0; i < imageList.length; i++) { // iterate for each Image Text value picked from wikidata
           if (arrayOfImageUrlFromWiki[i] === "") { // if the image field was not found in wikidata for a perticular entity
               arrayOfImageUrl[i] = "Image Not Found"; // set the array element as image not found
           } else {
               arrayOfImageUrl[i] = generateImageUrl(imageList[i]); // else generateImageUrl
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


})();
