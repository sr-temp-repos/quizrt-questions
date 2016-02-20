var app = angular.module('questionGenerator');


app.controller('questionGenerationController', [
  '$scope',
  '$http',
  function($scope,$http){
    $scope.stubList=[];
    $scope.totalStubs="";
    $http({
      method: 'GET',
      url: '/getStubsList'
    }).then(function successCallback(response) {
      $scope.stubList=response.data;
      $scope.totalStubs=response.data.length;
      console.log(response.data);
    }, function errorCallback(response) {
      // console.log("response errorCallback " + response);
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

    $scope.selectedStub = "";

    $scope.setSelectedStub=function setSelectedStub(stub){
      $scope.selectedStub=stub;
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
        $scope.showLoadingScreen=true;
      $scope.selectedStub["numberOfQuestions"]="ALL";
      var d = new Date();
      $scope.selectedStub["lastExecutedOn"]=new Date().getTime();


      console.log($scope.selectedStub);
      $http({method: 'Post', url: '/generateQuestions', data: {data: $scope.selectedStub}}).
        success(function(data, status, headers, config) {

          console.log(data);
          $http({method: 'Post', url: '/QuestionRequestHandler', data: {requestType:"add",filePath: data}}).
            success(function(data, status, headers, config) {
              $scope.selectedStub["insertionFailedFor"]=data["notInserted"];
              $scope.selectedStub["totalQuestionsGenerated"]=data["count"];
              $scope.selectedStub["successfullyInserted"]=data["inserted"];
              $http({method: 'Post', url: '/overWriteDupQuesStub', data: {data: $scope.selectedStub}}).
                success(function(data, status, headers, config) {
                  console.log(data);
                    $scope.showLoadingScreen=false;
                    $scope.notFirstRefresh=false;
                    $scope.firstRefresh=false;
                });
            });
        });
    }



  }]);
