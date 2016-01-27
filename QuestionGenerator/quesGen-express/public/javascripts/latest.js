(function(){
  var questionArray=[];
  var checkedProperties = [];
  var option;
  var propertyValueList = {};
  var getPropertyValueList = function(propertyName) {
      return propertyValueList[propertyName];
  };
  var resultUrl = 'http://wdq.wmflabs.org/api?q=';
  var qId;
  var qIdList=[];
  var optionData;
  var numberOfQuestionsGenrated; // variable to store number of questions Generated

$("#skipButton").on('click',function(){ // skip button in the help displaying div
  $('#introDiv').slideUp('slow'); // slideUp the intro div
});

$("#needHelp").on('click',function(){ // need help button... when clicked you get a screen with a series of instructions.
  $('#introDiv').slideDown('slow'); // slideDownthe intro div
  $("#introDivText").typed({ // a third party jquery which helps getting typing effect
    strings: ["Welcome To Project X . . ."," I Shall Help You Generate Questions",
              "You Shall Be Required To Key In One Sample Question",
              "E.G. Sample Question - Sachin Tendulkar is from which country ? ",
              "Once You Have Entered Sample Question.. I ll Ask you variable and option",
              "So, If  Sample Question is - Sachin Tendulkar is from which country ? Variable is - Sachin Tendulkar and Option Will Be - country ",],
    typeSpeed: 100,
    cursorChar:"|"
  });
});
// needHelp

  function addCheckbox(questionArray) {

      for(var i=0;i<questionArray.length;i++){
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
      for(var i=0;i<questionArray.length;i++){
        var container = $('#rdList');
        var inputs = container.find('input');
        var id = inputs.length;
        container.append($("<div class='radio'>")).append($('<input />', {
            type: 'radio',
            id: 'rd' + i,
            value: questionArray[i],
            name:"radioList"
        }).addClass("col-lg-1")).append($('<label />', {
            'for': 'rd' + i,
            text: questionArray[i]
        }).addClass("col-lg-3 text-left"));
      }

      return;
  }

  function getQuestionArray(sampleQuestion){
    var questionArray=sampleQuestion.split(" ");
    if(questionArray.length<3)
    alert("Enter at least 3 words!");
    else {
      return questionArray;
    }
  }

  function getSampleQuestion(){
    $("#sampleQuestionButton").on("click", function() {
        $('#cbList').find("input").remove();
        $('#cbList').find("label").remove();
        var sampleQuestion = $("#sampleQuestion").val();
        questionArray=getQuestionArray(sampleQuestion);
        addCheckbox(questionArray);
        $("#resetPage").show();
        $("#resetPage").on("click", function() {
          location.reload();
        });
    });

  }
  getSampleQuestion();

  function getVariableList(){
    $("#getVariableList").on("click", function() {
      // var arrayForOption=[];
      // var count=0;
      $("#checkBoxDiv").slideUp();
      $.each($("input[type='checkbox']:checked"), function() {
        for(var i=0;i<questionArray.length;i++ ){
          if($(this).val()==questionArray[i])
          checkedProperties[i]="Var";
          else{
            if(checkedProperties[i]!="Var"){
            checkedProperties[i]="Const";
          }
          }
        }
      });
//       for(var j=0;j<checkedProperties.length;j++)
//       if(checkedProperties[j]=="Const"){
//       arrayForOption[count]=questionArray[j];
//       count++;
// }
      addRadioButtons(questionArray);
      $("#radioDiv").slideDown();
    });

  }
  getVariableList();

  var variableJson;
  function getEntityHints(item) {
      var count=0;
      qIdList = [];
      var link = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + item + "&language=en&format=json";
      $("#spinner").show();
      $.getJSON(link + "&callback=?", function(data) {
          variableJson=data;
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

  function getVariableProperty(variableJson){
      $("#spinner").show();

          $.each(variableJson["search"], function(k, v) {
              if(v["title"].substr(1)==qId){

              tempDescription=v["description"].split(" ");
              for(var i=0;i<tempDescription.length;i++){
                var container = $('#descriptionList');
                var inputs = container.find('input');
                var id = inputs.length;
                container.append($("<div class='radio'>")).append($('<input />', {
                    type: 'radio',
                    id: 'dl' + i,
                    value: tempDescription[i].split(",")[0],
                    name:"descriptionList"
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
                      var tempLink2 = "https://www.wikidata.org/wiki/Special:EntityData/Q" + numericID + ".json";
                      $('#entityPropertyList').find("li").remove();
                      $("#spinner").show();
                      // console.log("here@188"+tempLink2);

                      $.getJSON(tempLink2, function(data2) {
                          if (getPropertyValueList(data1["entities"][key]["labels"]["en"]["value"]+":"+key) == null) {
                              propertyValueList[data1["entities"][key]["labels"]["en"]["value"]+":"+key] = data2["entities"]["Q" + numericID]["labels"]["en"]["value"]+":"+numericID;
                          } else {
                              if (propertyValueList[data1["entities"][key]["labels"]["en"]["value"]+":"+key].includes(data2["entities"]["Q" + numericID]["labels"]["en"]["value"]+":"+numericID)) {

                              } else
                                  propertyValueList[data1["entities"][key]["labels"]["en"]["value"]+":"+key] = propertyValueList[data1["entities"][key]["labels"]["en"]["value"]+":"+key] + "," + data2["entities"]["Q" + numericID]["labels"]["en"]["value"]+":"+numericID;
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


  function getOption(){
    $("#getOption").on("click", function() {
      propertyValueList={};
      $("#radioDiv").slideUp();
      // $("#descriptionListDiv").slideDown();
      option=$('input[type="radio"]:checked').attr('id').split("")[2];
      getProperties(questionArray[option]);
      aggregatedResult=aggregateVarAndConst(questionArray,checkedProperties); // aggregate the data and varOrConst Parameter
      questionStub=generateQuestionStub(aggregatedResult,option); // generate dummy question stub json..
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
        optionData=$(this).text().split(":")[0];
        // console.log(optionData);
        // pId = pIdList[$(this).val()];
        // getPropertyValues();
    });
  }
  getOption();

  var searchedData={};
  function getData(propertyValueList,data){
    searchedData={};
    for (var key in propertyValueList) {
        if (propertyValueList.hasOwnProperty(key)) {
          if(key.includes(data)||propertyValueList[key].includes(data)){
            var temp=propertyValueList[key].split(",");
            var newData;
            for(var i=0;i<temp.length;i++){
              if(temp[i].includes(data))
              newData=temp[i];
            }
            searchedData[key]=newData;
          }
        }
    }

    return searchedData;
  }

  function getSelectedProperty(){
    $("#selected").on("click", function() {
      option=$('input[type="radio"][name="descriptionList"]:checked').val();

      var claimForVariablePart=getData(propertyValueList,option);
      var claimForOptionPart=getData(propertyValueList,optionData);

      generateQuestions(claimForVariablePart,claimForOptionPart,questionStub);
    });
  }
  getSelectedProperty();

    function generateQuestions(claimForVariablePart,claimForOptionPart,questionStub){
      var pidForVariable,qidForVariable,pidForOption;

      for (var key in claimForVariablePart) {
          if (propertyValueList.hasOwnProperty(key)) {

            pidForVariable=key.split(":")[1];
            qidForVariable=propertyValueList[key].split(":")[1];
          }
      }

      for (var key in claimForOptionPart) {
          if (propertyValueList.hasOwnProperty(key)) {

             pidForOption=key.split(":")[1];
          }
      }


      getPropertyValueResult(pidForVariable,qidForVariable,pidForOption);


    }

    var questionData={};
    var questionList=[];
    function getPropertyValueResult(pId,qId,pidForOption) {
      var count=0;
        var claim = 'claim[' + pId.substr(1) + ':' + qId + "]";
        // $('#resultList').find("li").remove();
         resultUrl = resultUrl + claim + "%20AND%20";

        var tempURL = 'https://www.wikidata.org/wiki/Special:EntityData/Q';

        $("#spinner").show();

        // console.log("@346"+resultUrl);
        $.getJSON(resultUrl + "&callback=?", function(data) {
            numberOfQuestionsGenrated=data["items"].length;
            $.each(data["items"], function(k, v) {
                if (k<200) {
                    var link = tempURL + v + ".json";
                    $("#spinner").show();
                    $.getJSON(link, function(data) {
                        var name = data["entities"]["Q" + v]["labels"]["en"]["value"];
                        var temp=data["entities"]["Q" + v]["claims"][pidForOption];
                        $.each(temp, function(k, v){
                          var temp2=temp[0]["mainsnak"]["datavalue"]["value"]["numeric-id"]
                          var link2=tempURL + temp[0]["mainsnak"]["datavalue"]["value"]["numeric-id"] + ".json";
                          $("#spinner").show();

                          $.getJSON(link2, function(data2) {
                            var name2 = data2["entities"]["Q" + temp2]["labels"]["en"]["value"];
                            questionData[name]=name2;
                            questionStub["Var"]=name;
                            questionStub["Option"]=name2;



                            questionList[count++]=questionStub["preConst"]+" "+questionStub["Var"]+" "+questionStub["postConst"]+" "+questionStub["Option"];
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

          var distractors=generateDistractors(questionList);
          
          $("#questionListHeading").append($('<strong>',{
            text:"Number of Questions Generated " + numberOfQuestionsGenrated
          }));
          for(var i=0;i<questionList.length;i++){
            $("#showGeneratedQuestionsOuter").show();
            $("#questionList").append($('<li>', {
                value: questionList[i].split("?")[0]+" ?",
                html: (i+1).toString().bold()+") "+" "+questionList[i].split("?")[0]+" ?"+ "<br>"+'" '+distractors[i][0].bold()+' "   '+distractors[i][1]+distractors[i][2]+distractors[i][3]
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


function generateQuestionStub(aggregatedResult,optionIndex) { // accepts an array of array having two array... one for aggregated data
                                                  // and one for var or const data for aggregated data
                                                  // option index is the index of word which shall be made option
    aggregatedWords = aggregatedResult[0]; // 0th index contains an array of aggregated data
    aggregatedVarOrConstForWords = aggregatedResult[1]; // 1st index contains an array of var or const

    questionStub = {}; // initialize dummy question stub

    var pre=true;
    var post=true;
    for (var i = 0; i < aggregatedWords.length; i++) { // run through the aggregated data
        if (aggregatedVarOrConstForWords[i] == "Var") { // if variable.. add in var Part
            questionStub["Var"] =aggregatedWords[i];
            pre=false;
        } else if(pre){ // else add in const part
            questionStub["preConst"] = aggregatedWords[i];
        }
        else {
          questionStub["postConst"] = aggregatedWords[i];
        }
    }

    if(questionStub["preConst"]==undefined){
        questionStub["preConst"]="";
      }
    if(questionStub["postConst"]==undefined){
        questionStub["postConst"]="";
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

    if(answers.length<4){
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


})();
