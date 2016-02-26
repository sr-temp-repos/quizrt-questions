var app = angular.module('questionGenerator');


app.controller('questionGenerationController', [
  '$scope',
  '$http',
  '$parse',
  function($scope,$http,$parse){
    $scope.stubList=[];
    $scope.totalStubs="";
    $http({
      method: 'GET',
      url: '/getStubsList'
    }).then(function successCallback(response) {
      $scope.stubList=response.data;
      $scope.totalStubs=response.data.length;
      $scope.totalQuestions=0;
      var totalQuestions=0
      for(var tempStub in $scope.stubList){
        if($scope.stubList[tempStub]['totalQuestionsGenerated']!==undefined && $scope.stubList[tempStub]['totalQuestionsGenerated']!==null)
        $scope.totalQuestions+=parseInt($scope.stubList[tempStub]['totalQuestionsGenerated']);
        //console.log($scope.stubList[tempStub]['totalQuestionsGenerated']);
      }
      console.log($scope.totalQuestions);
      console.log(response.data);
    }, function errorCallback(response) {
      // console.log("response errorCallback " + response);
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

    $scope.selectedStub = "";
    $scope.setSelectedStub=function setSelectedStub(stub){
      $scope.selectedStub=stub;
      $scope.firstRefresh=false;
      $scope.notFirstRefresh=false;
      if($scope.selectedStub["lastExecutedOn"]===null){
        $scope.firstRefresh=true;
      }
      else {
        $scope.notFirstRefresh=true;
      }
    }

    $scope.setTextForAlert=function setTextForAlert(){
      $scope.notFirstRefresh=false;
      $scope.firstRefresh=false;
    }


    $scope.refreshSlectedStubList=function refreshSlectedStubList(){
      $scope.isDisabled=true;
      $scope.selectedStub["executionStatus"]=null;
      $scope.selectedStub["running"]=true;
      $scope.selectedStub["executed"]=false;
      $scope.selectedStub["numberOfQuestions"]="ALL";
      var d = new Date();
      $scope.selectedStub["lastExecutedOn"]=new Date().getTime();
      var curTime=new Date().getTime();
      console.log($scope.selectedStub);
      $http({method: 'Post', url: '/generateQuestions', data: {data: $scope.selectedStub}}).
        success(function(data, status, headers, config) {

          console.log(data);
          $http({method: 'Post', url: '/QuestionRequestHandler', data: {requestType:"add",filePath: data}}).
            success(function(data, status, headers, config) {
              $scope.selectedStub["insertionFailedFor"]=data["notInserted"];

              if($scope.selectedStub["totalQuestionsGenerated"]!==null&&$scope.selectedStub["totalQuestionsGenerated"]!==undefined)
              $scope.totalQuestions+=($scope.selectedStub["totalQuestionsGenerated"]-data["count"]);
              
              $scope.selectedStub["totalQuestionsGenerated"]=data["count"];
              $scope.selectedStub["successfullyInserted"]=data["inserted"];

              $http({method: 'Post', url: '/overWriteDupQuesStub', data: {data: $scope.selectedStub}}).
                success(function(data, status, headers, config) {
                    $scope.notFirstRefresh=false;
                    $scope.firstRefresh=false;
                    $scope.selectedStub["running"]=false;
                    $scope.selectedStub["executed"]=true;
                    $scope.isDisabled=false;
                });
            });
        });
    }

  }]);
