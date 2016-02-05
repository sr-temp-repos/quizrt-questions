var QuestionManagerApp = angular.module("QuestionManagerApp", [
  'ngRoute',
  'bw.paging',
  'ui.bootstrap'
])
.config(function ($routeProvider, $locationProvider) {
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
