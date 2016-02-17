QuestionManagerApp.controller('index', ['$scope', '$uibModal', '$http', '$ajaxService', function($scope, $uibModal, $http, $ajaxService) {

  $scope = angular.extend($scope, {
    /* Dropdown options */
    noOfQuestions: [10, //first one default
                    25,
                    50,
                    'All'],
    selectedRowCountIndex: 2,
    selectedRowCount: 50,

    questions: [{}],

    /* Pagination Setup */
    firstQuestion: 0,
    currentPage: 1,
    /* default searchText */
    searchText:"",
    /* default sort setup*/
    sortType: '', // set the default sort type
    sortReverse: false  // set the default sort order
  });

  var QuestionManager = {

    /* Intializes the config data into the object */
    init: function(config) {
      angular.extend(this,config);
      this.getQuestionJson();
      this.registerHelpers();
      this.eventHandlers();
    },

    registerHelpers: function() {
      var self = this;
      self.$scope.dateFormater = function(date) {
        var tDate = new Date(date);
        return tDate;
      }
    },

    eventHandlers: function() {
      var self=this;
      self.$scope.onSearch= function(){
        self.getQuestionJson();
      };

      self.$scope.onReset= function() {
        self.$scope.searchText="";
        self.getQuestionJson();
      };

      self.$scope.noOfRowChange = function(item, indexSelected) {
        var $scp = self.$scope;
        $scp.firstQuestion = 0;
        $scp.currentPage = 1;
        $scp.selectedRowCount = (typeof item == 'number')? item : $scp.totalQuestions;
        $scp.selectedRowCountIndex = indexSelected;
        self.getQuestionJson();
      };

      self.$scope.onPageclick = function(page) {
        var $scp = self.$scope;
        $scp.firstQuestion = (page-1) * $scp.selectedRowCount;
        self.getQuestionJson();
      };
      self.$scope.onEditClick = function(index) {
        var modalInstance = self.$uibModal.open({
          animation: self.$scope.animationsEnabled,
          templateUrl: 'modal.html',
          controller: 'EditQuestionControl',
          resolve: {
            $mainControllerScope: function () {
              return {
                selectedQuestion: angular.copy(self.$scope.questions[index]),
                QuestionManager: self,
                dateFormater:self.$scope.dateFormater
              }
            }
          }
        });
      };
      self.$scope.onDeleteClick = function(index) {
        var selectedQuestion = self.$scope.questions[index];
        self.onQuestionDelete(self,selectedQuestion._id);
      };
      self.$scope.onSortClick = function(x) {
        self.$scope.sortType = x;
        self.$scope.sortReverse = !(self.$scope.sortReverse);
        self.getQuestionJson();
      };
    },
    getQuestionJson: function() {
      var self=this,
          $scp = self.$scope;

      self.$ajaxService.getQuestionJson({
        requestType: 'search',
        firstQuestion: $scp.firstQuestion,
        count: $scp.selectedRowCount,
        query: $scp.searchText,
        sortType: $scp.sortType,
        sortReverse: $scp.sortReverse
      }, function(err, results) {
        if(err)
        {
          console.log(err);
        }
        var dt = results.data;
        $scp.questions = dt.rows;
        $scp.totalQuestions = dt.count;
        $scp.lastQuestion = $scp.firstQuestion + $scp.selectedRowCount;
        $scp.lastQuestion = ($scp.lastQuestion > $scp.totalQuestions)? $scp.totalQuestions : $scp.lastQuestion;
      });
    },
    onQuestionDelete: function(self,id) {
      var scp = self.$scope;
      //console.log(scp);
      self.$ajaxService.onQuestionDelete({
        requestType: 'delete',
        questionId: id
      }, function(err, results) {
        if(err)
        {
          console.log(err);
        }
        self.getQuestionJson();
      });
    }
  };

  QuestionManager.init({
    $scope: $scope,
    $http: $http,
    $uibModal: $uibModal,
    $ajaxService: $ajaxService
  });

}]);
