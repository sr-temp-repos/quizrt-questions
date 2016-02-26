AuthApp.controller('AuthController', ['$scope','$ajaxService','$window', function($scope,$ajaxService,$window) {
  $scope.login = function() {
    var data = {
      username: $scope.username,
      password: $scope.password
    };
    $ajaxService.login(data, function(err, res) {
      if(err) {
        console.log(err);
      } else {
        console.log(res);
        if(res.data.status == 'success')
          $window.location.href = '/';
        else {
          $scope.message = "User name or password is invalid";
        }
      }
    });
  };
}]);
