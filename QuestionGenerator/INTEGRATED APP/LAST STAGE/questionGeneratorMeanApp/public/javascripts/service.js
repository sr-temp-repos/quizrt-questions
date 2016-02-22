var application=angular.module('questionGenerator', ['ngRoute','ngAnimate']);

application.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/home.html',
        controller: 'homeCtrl'
      })
      .when('/viewQuestion',{
        templateUrl: '/viewQuestions.html',
        controller: 'viewQuestion'
      })
      .when('/runJobs',{
        templateUrl: '/runQuestionGenrationService.html',
        controller: 'questionGenerationController'
      })
  }]);
