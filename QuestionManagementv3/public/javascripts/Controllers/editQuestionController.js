QuestionManagerApp.controller('EditQuestionControl', ['$scope','$http','$mainControllerScope','$window', '$uibModalInstance',
  function($scope, $http, $mainControllerScope, $window, $uibModalInstance) {
    angular.extend($scope,$mainControllerScope, {
      /* Message Array for Topic management */
      messages: [
        '',
        'Topic that was entered is new, please tag it with some category', // newTopic message
        'Category that was entered is new, please comfirm as requested below', // newCategory message
        'Failed to insert new Topic and Category, please try again', //error message
        'Topic cannot be Empty'
      ],
      messageSelect: 0,
      newTopicForm: false,
      newCategoryForm: false
    });
    EditModalManager.init({
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      $http: $http,
      $window: $window
    });
  }
]);
