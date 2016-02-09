QuestionManagerApp.controller('EditQuestionControl', ['$scope','$http','$mainControllerScope', '$uibModalInstance',
  function($scope, $http, $mainControllerScope, $uibModalInstance) {
    angular.extend($scope,$mainControllerScope, {
      /* Message Array for Topic management */
      messages: [
        '',
        'Topic that was entered is new, please tag it with some category', // newTopic message
        'Category that was entered is new, please comfirm as requested below', // newCategory message
        'Failed to insert new Topic and Category, please try again' //error message
      ],
      messageSelect: 0,
      newTopicForm: false,
      newCategoryForm: false
    });
    EditModalManager.init({
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      $http: $http
    });
  }
]);
