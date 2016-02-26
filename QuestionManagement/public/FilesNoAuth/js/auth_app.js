var AuthApp = angular.module("AuthApp", [
  'ngRoute',
  'ui.bootstrap'
]);

AuthApp.config(function ($routeProvider, $locationProvider, $provide) {
  $routeProvider
    .when('/signup', {
      templateUrl: '../signup.html',
      controller: 'AuthController'
    })
    .when('/login', {
      templateUrl: '../Auth.html',
      controller: 'AuthController'
    });

  $locationProvider.html5Mode(true);
});

AuthApp.service('$ajaxService', function($http) {

  this.login = function(data, callback) {
    $http({
      url: '/login',
      data: data,
      method: 'post'
    }).then(function(results) {
      callback(null, results);
    }, function errorCall(data) {
      callback(data, null);
    });
  };

});
