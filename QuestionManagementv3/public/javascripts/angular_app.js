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
    .when('/login', {templateUrl: 'login.html', controller: 'loginController'},access: {restricted: false})
    .when('/logout', {controller: 'logoutController'},access: {restricted: true})
    .when('/register', {templateUrl: 'register.html', controller: 'registerController'},access: {restricted: true})
    .when('/one', {template: '<h1>This is page one!</h1>'},access: {restricted: true})
    .when('/two', {template: '<h1>This is page two!</h1>'},access: {restricted: false})
    .otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});

QuestionManagerApp.run(function ($rootScope, $location, $route, AuthService) {
  $rootScope.$on('$routeChangeStart', function (event, next, current) {
    if (next.access.restricted && AuthService.isLoggedIn() === false) {
      $location.path('/login');
    }
  });
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
   };
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
   };
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
   };
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
   };
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
   };
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
   };
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
   };
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
   };
});
QuestionManagerApp.factory('AuthService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    // create user variable
    var user = null;

    // return available functions for use in controllers
    return ({
      isLoggedIn: isLoggedIn,
      getUserStatus: getUserStatus,
      login: login,
      logout: logout,
      register: register
    });
    function isLoggedIn() {
        if(user) {
          return true;
        } else {
          return false;
        }
    }

    function getUserStatus() {
      return user;
    }

    function login(username, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/user/login', {username: username, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.status){
            user = true;
            deferred.resolve();
          } else {
            user = false;
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          user = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function logout() {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a get request to the server
      $http.get('/user/logout')
        // handle success
        .success(function (data) {
          user = false;
          deferred.resolve();
        })
        // handle error
        .error(function (data) {
          user = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function register(username, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/user/register', {username: username, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.status){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

}]);
