var QuestionManagerApp = angular.module("QuestionManagerApp", [
  'ngRoute',
  'bw.paging',
  'ui.bootstrap',
  'ngAnimate'
])
.config(function ($routeProvider, $locationProvider, $provide) {
  $routeProvider
    .when('/', {
      templateUrl: 'QuestionManager.html',
      controller: 'index',
      controllerAs: 'indexController'
    })
    .otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});
QuestionManagerApp.service('$ajaxService', function($http){
   this.getQuestionJson = function(data, callback) {

     $http({
       url: '/QuestionRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   },
   this.onQuestionDelete = function(data, callback) {
     $http({
       url: '/QuestionRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   },
   this.addTopic = function(data, callback) {
     $http({
       url: '/TopicsRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   },
   this.addCategoryId = function(data, callback) {
     $http({
       url: '/TopicsRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   },
   this.yesBtnClicked = function(data, callback) {
     $http({
       url: '/TopicsRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   },
   this.QuestionSave = function(data, callback) {
     $http({
       url: '/QuestionRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   },
   this.getCategoriesDatalist = function(data, callback) {
     $http({
       url: '/TopicsRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   },
   this.getTopicDatalist = function(data, callback) {
     $http({
       url: '/TopicsRequestHandler',
       data: data,
       // dataType: 'json',
       method: 'post'
     }).then(function(results) {
       callback(null,results);
     }, function errorCall(data) {
       callback(data,null);
     });
   }
});
