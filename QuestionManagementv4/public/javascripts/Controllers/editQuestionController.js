QuestionManagerApp.controller('EditQuestionControl', ['$scope','$http','$mainControllerScope','$window', '$uibModalInstance', '$ajaxService',
  function($scope, $http, $mainControllerScope, $window, $uibModalInstance, $ajaxService) {
    angular.extend($scope,$mainControllerScope, {
      /* Message Array for Topic management */
      messages: [
        '',
        'Topic that was entered is new, please tag it with some category', // newTopic message
        'Category that was entered is new, please comfirm as requested below', // newCategory message
        'Failed to insert new Topic and Category, please try again', //error message
        'Topic cannot be Empty. Please add a topic using below form.', // If topic empty
        'Duplicate Topic Not Allowed. Try some other Topic name.' // Duplicate topic addition
      ],
      messageSelect: 0,
      newTopicForm: false,
      newCategoryForm: false
    });

    var EditModalManager = {
      init: function(config) {
        angular.extend(this,config);
        this.registerHelper();
        this.eventHandler();
      },
      registerHelper: function() {
        var self=this;
        self.$scope.getTabs = function() {
          var tabs=[];
          for( var i=0;i<self.$scope.selectedQuestion.options.length;i++ ) {
            tabs.push({
              content: self.$scope.selectedQuestion.options[i],
              active: (i==0)
            });
          }
          return tabs;
        };
        self.$scope.selectedQuestion.correctIndex++;
        self.$scope.tabs=self.$scope.getTabs();
        self.$scope.topics = [];
        self.$scope.categories = [];
        self.$scope.getTopicDatalist = function() {
          var topicObjArray = [];
          self.$ajaxService.getTopicDatalist(
            {
              requestType: 'listTopics'
            }, function(err, results) {
              if(err)
              {
                console.log(err);
              }
              self.$scope.topics = results.data.map(function(dt) { return dt.topicName; });
            });
        };
        self.$scope.getTopicDatalist();

        self.$scope.getCategoriesDatalist = function() {
          var categoryObjArray = [];
          self.$ajaxService.getCategoriesDatalist(
            {
              requestType: 'listCategories'
            }, function(err, results) {
              if(err)
              {
                console.log(err);
              }
              self.$scope.categories = results.data.map(function(dt) { return dt.categoryName; });
          });
        };
        self.$scope.getCategoriesDatalist();

      },
      eventHandler: function() {
        var self = this;
        self.$scope.editQuestionClose = function() {
           self.$uibModalInstance.dismiss('cancel');
        };
        self.$scope.addOption = function() {
          var scp = self.$scope;
          for(var i in scp.tabs)
          {
            if(scp.tabs[i].active) {
              scp.tabs[i].active=false;
              scp.tabs.push({
                active: 'true',
                content: ''
              });
              break;
            }
          }

        }
        self.$scope.deleteOption = function(index) {
          self.deleteOption(self,index);
        };
        self.$scope.addNewTopic = function() {
          self.addTopic(self);
        };
        self.$scope.deleteTopic = function(index) {
          self.deleteTopic(self,index);
        };
        self.$scope.addCategories = function() {
          self.addCategoryId(self);
        };
        self.$scope.cancelCategories = function() {
          self.cancelCategoryIdClicked(self);
        };
        self.$scope.onYesBtnClick = function() {
          self.yesBtnClicked(self);
        };
        self.$scope.onNoBtnClick = function() {
          self.noBtnClicked(self);
        };
        self.$scope.newTopic = function(topic,category) {
          self.newTopic(self,topic,category);
        };
        self.$scope.onQuestionSave = function(question) {
          // console.log(question);
          self.QuestionSave(self,question);
        };
      },
      deleteOption: function(self, index) {
        var scp = self.$scope;
        scp.tabs.splice(index, 1);
      },
      addTopic: function(self) {
        var scp = self.$scope;

        if(scp.topicName.length == 0)
        {
          scp.messageSelect = 4;
          return;
        }
        if( scp.selectedQuestion.topics.split(', ').indexOf(scp.topicName) > -1 ) {
          scp.messageSelect = 5;
          return;
        }
        scp.messageSelect = 0;
        scp.newTopicObj = "";
        self.$ajaxService.addTopic({
          requestType: 'checkTopic',
          checkExist: scp.topicName
         }, function(err, results) {
           if(err)
           {
             console.log(err);
           }
           var dt = results.data;
           if(dt.status==='success') {
             if(!scp.selectedQuestion.topicId || scp.selectedQuestion.topicId.length < 1) {
               scp.selectedQuestion.topics = dt.topicObj.topicName;
               scp.selectedQuestion.categories = dt.topicObj.topicCategory;
               scp.selectedQuestion.topicIds = dt.topicObj._id;
             } else {
               scp.selectedQuestion.topics = scp.selectedQuestion.topics + ', ' + dt.topicObj.topicName;
               scp.selectedQuestion.categories = scp.selectedQuestion.categories + ', ' + dt.topicObj.topicCategory;
               scp.selectedQuestion.topicIds = scp.selectedQuestion.topicIds + ', '+ dt.topicObj._id;
             }
           } else {
             scp.messageSelect = 1;
             scp.newTopicForm = true;
             scp.newTopicObj = scp.topicName;
           }
         });
      },
      deleteTopic: function(self, index) {
        var scp = self.$scope,
            sq = scp.selectedQuestion,
            topics = sq.topics.replace(/\s/g,'').split(','),
            categories = sq.categories.replace(/\s/g,'').split(',');
            topicIds = sq.topicIds.replace(/\s/g,'').split(',');
        topics.splice(index,1);
        categories.splice(index,1);
        topicIds.splice(index,1);
        sq.topics = topics.join(', ');
        sq.categories = categories.join(', ');
        sq.topicIds = topicIds.join(', ');
      },
      addCategoryId: function(self) {
        var scp = self.$scope;
        console.log(scp.newTopicObj);
        self.$ajaxService.addCategoryId({
          requestType: 'checkCategory',
          checkExist: scp.categoryName,
          topicObj : scp.newTopicObj
        }, function(err, results) {
          if(err)
          {
            console.log(err);
          }
          var dt = results.data;
          if(dt.status==='success') {
            if(!scp.selectedQuestion.topicId || scp.selectedQuestion.topicId.length < 1) {
              scp.selectedQuestion.topics = dt.topicObj.topicName;
              scp.selectedQuestion.categories = dt.topicObj.topicCategory;
              scp.selectedQuestion.topicIds = dt.topicObj._id;
            } else {
              scp.selectedQuestion.topics = scp.selectedQuestion.topics + ', ' + dt.topicObj.topicName;
              scp.selectedQuestion.categories = scp.selectedQuestion.categories + ', ' + dt.topicObj.topicCategory;
              scp.selectedQuestion.topicIds = scp.selectedQuestion.topicIds + ', '+ dt.topicObj._id;
            }
            scp.messageSelect = 0;
            scp.newTopicForm = false;
          } else {
            scp.messageSelect = 2;
            scp.newCategoryForm = true;
            scp.newTopicObj = dt.topicObj;
          }
        });
      },
      cancelCategoryIdClicked: function(self) {
        var scp = self.$scope;
        scp.newTopicForm = false;
        scp.messageSelect = 0;
      },
      yesBtnClicked: function(self) {
        var scp = self.$scope;
        console.log(scp.newTopicObj);
        self.$ajaxService.yesBtnClicked(
          {
            requestType: 'addTopicCategory',
            topicObj : scp.newTopicObj
          }, function(err, results) {
            if(err)
            {
              console.log(err);
            }
            var dt = results.data;
            if(dt.status==='success') {
              console.log(dt.topicObj);
              if(!scp.selectedQuestion.topicId || scp.selectedQuestion.topicId.length < 1) {
                scp.selectedQuestion.topics = dt.topicObj.topicName;
                scp.selectedQuestion.categories = dt.topicObj.topicCategory;
                scp.selectedQuestion.topicIds = dt.topicObj._id;
              } else {
                scp.selectedQuestion.topics = scp.selectedQuestion.topics + ', ' + dt.topicObj.topicName;
                scp.selectedQuestion.categories = scp.selectedQuestion.categories + ', ' + dt.topicObj.topicCategory;
                scp.selectedQuestion.topicIds = scp.selectedQuestion.topicIds + ', '+ dt.topicObj._id;
              }
                scp.messageSelect = 0;
                scp.newCategoryForm = false;
                scp.newTopicForm = false;
          } else {
                scp.messageSelect = 2;
                scp.newCategoryForm = true;
                scp.newTopicObj = dt.topicObj;
          }
        });
      },
      noBtnClicked: function(self) {
          var scp = self.$scope;
          scp.newCategoryForm = false;
          scp.messageSelect = 1;
      },
      QuestionSave: function(self,question) {
        var scp = self.$scope;
        // checking Option tab is empty, if so focus
        for(var index in scp.tabs) {
          if(!scp.tabs[index].content)
          {
            for(var i in scp.tabs)
            {
              if(scp.tabs[i].active) {
                scp.tabs[i].active=false;
                scp.tabs[index].active=true;
                break;
              }
            }
            return;
          }
        }
        if(!question.topicId || question.topicId.length < 1 )
        {
          scp.messageSelect = 4;
          return;
        }

        question.options = scp.tabs.map(function (tab) { return tab.content; })
        console.log(question);
        self.$ajaxService.QuestionSave(
          {
            requestType: 'save',
            question: question
          }, function(err, results) {
            if(err)
            {
              console.log(err);
            }
            self.$uibModalInstance.dismiss('cancel');
            scp.QuestionManager.getQuestionJson();
          });
        }
    };

    EditModalManager.init({
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      $http: $http,
      $window: $window,
      $ajaxService: $ajaxService
    });
  }
]);
