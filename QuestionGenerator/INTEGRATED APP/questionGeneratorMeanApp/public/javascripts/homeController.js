var app = angular.module('questionGenerator');


app.controller('homeCtrl', [
'$scope',
'$http',
'$location',
function($scope,$http,$location){

  $scope.redirectToViewQuestions=function(){
    $location.path('/viewQuestion');
  }

  $scope.redirectToRunJobs=function(){
    $location.path('/runJobs');
  }
}]);
