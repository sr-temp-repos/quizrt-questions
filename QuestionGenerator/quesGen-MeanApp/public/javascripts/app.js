var app = angular.module('questionGenerator', ['ui.bootstrap']);


app.controller('MainCtrl', [
'$scope',
'$http',
function($scope,$http){
  $scope.exclusionList=[];
  $scope.topicsList={};
  $scope.optionsArray=[];
  $scope.maxNumberOfOptions=12;
  $scope.minNumberOfOptions=2;

  for (var i = $scope.minNumberOfOptions; i <= $scope.maxNumberOfOptions; i++) {
    $scope.optionsArray.push(i);
  }

  $http({
  method: 'GET',
  url: '/getExclusionList'
}).then(function successCallback(response) {
  for (var i = 0; i < response.data.length; i++) {
    $scope.exclusionList[i]=response.data[i]["word"];
  }
  }, function errorCallback(response) {
    // console.log("response errorCallback " + response);
    // called asynchronously if an error occurs
    // or server returns response with an error status.
  });

  $http({
  method: 'GET',
  url: '/getTopicsList'
}).then(function successCallback(response) {
  for (var i = 0; i < response.data.length; i++) {
    console.log(response.data[i]["_id"]);
    console.log(response.data[i]["name"]);
    $scope.topicsList[response.data[i]["_id"]]=response.data[i]["name"];
  }
  }, function errorCallback(response) {
    console.log(response);
    // called asynchronously if an error occurs
    // or server returns response with an error status.
  });

  $scope.sampleQuestionEntered = function(){
    if(!$scope.question || $scope.question === '') { return; }
    // $scope.sampleQuestionAfterExlusion=$scope.question
    $scope.filteredQuestion=filterQuestion($scope.question,$scope.exclusionList);
    $scope.boolValueForButtons=true;

    $scope.showVariableSelectionDiv=true;
    $scope.showOptionSelectionDiv=false;
    $scope.showVariableResultSelectionDiv=false;
    $scope.showOptionResultSelectionDiv=false;
    $scope.showVariablePropertiesDiv=false;
    $scope.showGeneratedQuestions=false;
    $scope.showSaveQuesStub=false;
    $scope.showSuccessMessage=false;
    $scope.divForSelectionOfNumberOfOptions=false;

  };

  $scope.topicsSelected = function(){
    $scope.topicIds=$scope.selection;
  //   $scope.selection=[];
    $scope.showTopicSelectionDiv=false;
  //   $scope.showVariableSelectionDiv=true;
   $scope.questionStubJsonDoc={};
  $scope.questionStubJsonDoc["pIdForVar"]=$scope.finalPidForVariable;
  $scope.questionStubJsonDoc["qIdForVar"]=$scope.finalQidForVariable;
  $scope.questionStubJsonDoc["pIdForOpt"]=$scope.finalPidForOption;
  $scope.questionStubJsonDoc["questionStub"]=$scope.questionStub;
  $scope.questionStubJsonDoc["topicIds"]=$scope.topicIds;
  $scope.questionStubJsonDoc["numberOfOptionsToBeGenerated"]=$scope.numberOfOptionsToBeGenerated;

  $scope.showLoadingScreen=true;
  $http({method: 'Post', url: '/saveQuestionPattern', data: {data: $scope.questionStubJsonDoc}}).
    success(function(data, status, headers, config) {
      // if (status==500) {
      //   console.log("duplicate found");
      //   console.log(data);
      //
      // }
      $scope.showLoadingScreen=false;

      if (data.patternId !== undefined) {
        console.log("#############");
        $scope.showSaveQuesStub=false;
        $scope.resetPageButton=false;
        $scope.successMessage="Duplicate Stub Pattern Found... Shall I Go Ahead and Update It ?";
        $scope.showSuccessMessage=true;
        $scope.showDivForUpdateQueStub=true;
        $scope.duplicateQuestionStub=data;
      }
      else {
        $scope.showSaveQuesStub=false;
        $scope.successMessage=data;
        $scope.showSuccessMessage=true;
        $scope.resetPageButton=true;

      }

      console.log(data);
    });

  // console.log(questionStubJsonDoc);
  };

  $scope.overWriteDupQuesStub=function(){
    $http({method: 'Post', url: '/overWriteDupQuesStub', data: {data: $scope.questionStubJsonDoc}}).
      success(function(data, status, headers, config) {
        $scope.successMessage=data;
        $scope.showSuccessMessage=true;
        $scope.showDivForUpdateQueStub=false;
        $scope.resetPageButton=true;
      });

  };

  $scope.variablesSelected = function(){
    $scope.boolValueForButtons=true;
    $scope.variable=$scope.filteredQuestion.filter(function (eachWord) {
      return $scope.selection.indexOf(eachWord) !== -1;
      });
    // console.log($scope.variable);
    $scope.selection = [];

    $scope.filteredQuestion=$scope.filteredQuestion.filter(function(eachWord){
      return $scope.variable.indexOf(eachWord) === -1;
    });
    $scope.showVariableSelectionDiv=false;
    $scope.showOptionSelectionDiv=true;
  };

  $scope.optionsSelected = function(){
    $scope.boolValueForButtons=true;
    $scope.option=$scope.filteredQuestion.filter(function (eachWord) {
      return $scope.selection.indexOf(eachWord) !== -1;
      });
    // console.log($scope.option);
    $scope.selection = [];

    $scope.showOptionSelectionDiv=false;

    $scope.variable=$scope.variable.toString().replace(","," ");
    $scope.option=$scope.option.toString().replace(","," ");

    sendVariableAndOptionToServer($scope.variable,$scope.option,$http,$scope);
    // console.log($scope.selection);
  };

$scope.optionsSelectedFromVariableSearchResult=function(){
  $scope.boolValueForButtons=true;

  $scope.variableContextFromUser=$scope.textOfSelectedRadioButton;
  $scope.showVariableResultSelectionDiv=false;
  $scope.showOptionResultSelectionDiv=true;
};

$scope.optionsSelectedFromOptionSearchResult=function(){
  $scope.boolValueForButtons=true;

  $scope.optionContextFromUser=$scope.textOfSelectedRadioButton;
  $scope.showOptionResultSelectionDiv=false;

  // console.log($scope.variableContextFromUser);
  // console.log($scope.optionContextFromUser);

  sendVariableAndOptionContextToServer($scope,$http);
};
$scope.showDivForNumberOfOption=function(){
  $scope.variableEntityTypeFromUser=$scope.textOfSelectedRadioButton;
  $scope.showVariablePropertiesDiv=false;
  $scope.divForSelectionOfNumberOfOptions=true;
}
$scope.sendPAndQForVariableAndOption=function(){
  console.log($scope.textOfSelectedRadioButton);
  $scope.divForSelectionOfNumberOfOptions=false;
  $scope.numberOfOptionsToBeGenerated=$scope.textOfSelectedRadioButton;
  figureOutPandQCombinationForVarAndPidOfOption($http,$scope);
}
  // selected part from check box group
  $scope.selection = [];

  // toggle selection for a given checkbox by name
  $scope.toggleSelection = function toggleSelection(questionWord) {
    var idx = $scope.selection.indexOf(questionWord);

    // is currently selected
    if (idx > -1) {
      $scope.selection.splice(idx, 1);

    }

    // is newly selected
    else {
      $scope.selection.push(questionWord);

    }
    console.log($scope.selection);
    if ($scope.selection.length>0) {
      $scope.boolValueForButtons=false;
    }
    else {
      $scope.boolValueForButtons=true;

    }
  };

  $scope.selectedOption=function(selectedRadioButton){
    $scope.boolValueForButtons=false;

    $scope.textOfSelectedRadioButton=selectedRadioButton;
    // console.log($scope.textOfSelectedRadioButton);
  };

  $scope.saveQuestionStub=function(){
    $scope.showTopicSelectionDiv=true;


  };

  $scope.resetPage=function(){
    $scope.showSuccessMessage=false;
    $scope.showGeneratedQuestions=false
    $scope.question="";
    $scope.sampleQuestionEntered();
  };
}]);

function sendVariableAndOptionToServer(variable,option,$http,$scope){
  $scope.showLoadingScreen=true;
  $http({method: 'Post', url: '/getHintsForVariable', data: {data: variable}}).
    success(function(data, status, headers, config) {
      $scope.searchResultForVariable=processTheSearchResults(data);
      $scope.showVariableResultSelectionDiv=true;
      $scope.showLoadingScreen=false;

    });
    $scope.showLoadingScreen=true;

    $http({method: 'Post', url: '/getHintsForOption', data: {data: option}}).
      success(function(data, status, headers, config) {
        $scope.searchResultForOption=processTheSearchResults(data);
        $scope.showLoadingScreen=false;
      });

}


function sendVariableAndOptionContextToServer($scope,$http)
{
  // console.log($scope.variableContextFromUser.pOrQid);
  // console.log($scope.optionContextFromUser.pOrQid);

  $scope.showLoadingScreen=true;
  var dataToBeSentToServer=[];
  dataToBeSentToServer.push($scope.variableContextFromUser.pOrQid);
  dataToBeSentToServer.push($scope.exclusionList);
  // console.log(dataToBeSentToServer);
  $http({method: 'Post', url: '/getJsonDataForVariable', data: {data:dataToBeSentToServer }}).
    success(function(data, status, headers, config) {
      $scope.listOfObjectsVariableCouldMean=data;
      // console.log($scope.listOfObjectsVariableCouldMean);
      $scope.showLoadingScreen=false;
      $scope.showVariablePropertiesDiv=true;
    });
}

function figureOutPandQCombinationForVarAndPidOfOption($http,$scope){
  // console.log($scope.listOfObjectsVariableCouldMean);
  // console.log($scope.variableEntityTypeFromUser);
  // console.log($scope.optionContextFromUser);

  for (var firstTempVarForKeyRunover in $scope.listOfObjectsVariableCouldMean) {
    if ($scope.listOfObjectsVariableCouldMean.hasOwnProperty(firstTempVarForKeyRunover)) {
      if($scope.listOfObjectsVariableCouldMean[firstTempVarForKeyRunover] === $scope.variableEntityTypeFromUser){
        $scope.finalQidForVariable=firstTempVarForKeyRunover;
        $scope.finalPidForVariable=$scope.variableEntityTypeFromUser["pNum"];
        $scope.finalPidForOption=$scope.optionContextFromUser["pOrQid"];
        break;
      }
    }
  }
  // console.log($scope.finalPidForVariable);
  // console.log($scope.finalQidForVariable);
  // console.log($scope.finalPidForOption);

  $scope.questionSplitByVariable=$scope.question.split($scope.variable);
  $scope.questionStub={};
  if($scope.questionSplitByVariable[0] !=="" & $scope.question[1] !=="")
  {
    $scope.questionStub["pre"]=$scope.questionSplitByVariable[0];
    $scope.questionStub["var"]=$scope.variable;
    $scope.questionStub["post"]=$scope.questionSplitByVariable[1];
  }
  else if ($scope.questionSplitByVariable[0] ==="") {
    $scope.questionStub["pre"]="";
    $scope.questionStub["var"]=$scope.variable;
    $scope.questionStub["post"]=$scope.questionSplitByVariable[1];
  }
  else {
    $scope.questionStub["pre"]=$scope.questionSplitByVariable[0];
    $scope.questionStub["var"]=$scope.variable;
    $scope.questionStub["post"]="";
  }
  // console.log($scope.questionStub);

  $scope.showLoadingScreen=true;
  var dataToBeSentToServer={};
  // dataToBeSentToServer.push($scope.finalPidForVariable);
  // dataToBeSentToServer.push($scope.finalQidForVariable);
  // dataToBeSentToServer.push($scope.finalPidForOption);
  // dataToBeSentToServer.push($scope.questionStub);
  // dataToBeSentToServer.push($scope.topicIds);
  // console.log(dataToBeSentToServer);
  dataToBeSentToServer["pIdForVar"]=$scope.finalPidForVariable;
  dataToBeSentToServer["qIdForVar"]=$scope.finalQidForVariable;
  dataToBeSentToServer["pIdForOpt"]=$scope.finalPidForOption;
  dataToBeSentToServer["questionStub"]=$scope.questionStub;
  dataToBeSentToServer["topicIds"]=$scope.topicIds;
  dataToBeSentToServer["numberOfQuestions"]=100; // hardcoded as of now
  dataToBeSentToServer["numberOfOptionsToBeGenerated"]=$scope.numberOfOptionsToBeGenerated;
  console.log(dataToBeSentToServer);
  $http({method: 'Post', url: '/generateQuestions', data: {data:dataToBeSentToServer }}).
    success(function(data, status, headers, config) {
      console.log(data);
      console.log(data.length);
      $scope.generateQuestionsList=data;
      for (var i = 0; i < $scope.generateQuestionsList.length; i++) {
        var tempArrayForOptions=[];
        $scope.generateQuestionsList[i]["options"]=[];
        for (var j = 1; j <= $scope.numberOfOptionsToBeGenerated; j++) {
          tempArrayForOptions.push($scope.generateQuestionsList[i]["option"+j]);
        }
        $scope.generateQuestionsList[i]["options"]=tempArrayForOptions;

      }
      $scope.showLoadingScreen=false;
      $scope.showGeneratedQuestions=true;
      $scope.showSaveQuesStub=true;

    });
}
function processTheSearchResults(data){
  // console.log(data);
  var arrayOfDescriptions=[];
  // console.log(data);
  for (var i = 0; i < data["search"].length; i++) {
    var label=data["search"][i]["label"];
    var description=data["search"][i]["description"];
    var pOrQid=data["search"][i]["id"];
    arrayOfDescriptions[i]={label:label,description:description,pOrQid:pOrQid};
  }
  return arrayOfDescriptions;
}


function filterQuestion(question,exclusionList){
  var questionSplittedIntoWords=question.split(' ');
  return questionSplittedIntoWords.filter(function (eachWord) {
      return exclusionList.indexOf(eachWord.toLowerCase()) === -1;
    });
}
