QuestionManagerApp.controller('EditQuestionControl', ['$scope','$http','$mainControllerScope','$window', '$uibModalInstance',
  function($scope, $http, $mainControllerScope, $window, $uibModalInstance) {
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
          for( var i=1;i<=12;i++ ) {
            if( self.$scope.selectedQuestion['option' + i] ) {
              tabs.push({
                content: self.$scope.selectedQuestion['option' + i],
                active: (i==1),
                title: 'Option ' + i
              });
            } else {
              break;
            }
          }
          return tabs;
        };
        self.$scope.tabs=self.$scope.getTabs();

        self.$scope.getMax = function(question){
          for( var i=1;i<=12;i++ ) {
            if( question['option' + i] ) {
            } else {
              break;
            }
          }
          return i-1;
        },
        self.$scope.getTopicDatalist = function() {
          var topicObjArray = [];
          self.$http({
            url: '/TopicsRequestHandler',
            data: {requestType: 'listTopics'},
            method: 'post'
          }).then(function(results) {
              // console.log(results.data);
              for( var i=0;i< results.data.length;i++)
              {
                  topicObjArray.push(results.data[i].name);
              }
          });
          return topicObjArray;
        };
        self.$scope.topics = self.$scope.getTopicDatalist();
        // console.log(self.$scope.topics);
        self.$scope.getCategoriesDatalist = function() {
          var categoryObjArray = [];
          self.$http({
            url: '/TopicsRequestHandler',
            data: {requestType: 'listCategories'},
            method: 'post'
          }).then(function(results) {
              // console.log(results.data);
              for( var i=0;i< results.data.length;i++)
              {
                  categoryObjArray.push(results.data[i].name);
              }
          });
          return categoryObjArray;
        };
        self.$scope.categories = self.$scope.getCategoriesDatalist();
        // console.log(self.$scope.categories);
      },
      eventHandler: function() {
        var self = this;
        self.$scope.editQuestionClose = function() {
           self.$uibModalInstance.dismiss('cancel');
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
        self.$http({
          url: '/TopicsRequestHandler',
          data: {requestType: 'checkTopic', checkExist: scp.topicName },
          method: 'post'
        }).then(function(results) {
          var dt = results.data;
          if(dt.status==='success') {
            if(!scp.selectedQuestion.topicId || scp.selectedQuestion.topicId.length < 1) {
              scp.selectedQuestion.topics = dt.topicObj.name;
              scp.selectedQuestion.categories = dt.topicObj.category;
              scp.selectedQuestion.topicId = dt.topicObj._id;
            } else {
              scp.selectedQuestion.topics = scp.selectedQuestion.topics + ', ' + dt.topicObj.name;
              scp.selectedQuestion.categories = scp.selectedQuestion.categories + ', ' + dt.topicObj.category;
              scp.selectedQuestion.topicId = scp.selectedQuestion.topicId + ', '+ dt.topicObj._id;
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
            topicIds = sq.topicId.replace(/\s/g,'').split(',');
        topics.splice(index,1);
        categories.splice(index,1);
        topicIds.splice(index,1);
        sq.topics = topics.join(', ');
        sq.categories = categories.join(', ');
        sq.topicId = topicIds.join(', ');
      },
      addCategoryId: function(self) {
        var scp = self.$scope;
        console.log(scp.newTopicObj);
        self.$http({
          url: '/TopicsRequestHandler',
          data: {requestType: 'checkCategory', checkExist: scp.categoryName, topicObj : scp.newTopicObj },
          method: 'post'
        }).then(function(results) {
          console.log(results);
          var dt = results.data;
          console.log(dt);
          if(dt.status==='success') {
            if(!scp.selectedQuestion.topicId || scp.selectedQuestion.topicId.length < 1) {
              scp.selectedQuestion.topics = dt.topicObj.name;
              scp.selectedQuestion.categories = dt.topicObj.category;
              scp.selectedQuestion.topicId = dt.topicObj._id;
            } else {
              scp.selectedQuestion.topics = scp.selectedQuestion.topics + ', ' + dt.topicObj.name;
              scp.selectedQuestion.categories = scp.selectedQuestion.categories + ', ' + dt.topicObj.category;
              scp.selectedQuestion.topicId = scp.selectedQuestion.topicId + ', '+ dt.topicObj._id;
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
        self.$http({
          url: '/TopicsRequestHandler',
          data: {requestType: 'addTopicCategory',  topicObj : scp.newTopicObj },
          method: 'post'
        }).then(function(results) {
          console.log(results);
          var dt = results.data;
          console.log(dt);
          if(dt.status==='success') {
            if(!scp.selectedQuestion.topicId || scp.selectedQuestion.topicId.length < 1) {
              scp.selectedQuestion.topics = dt.topicObj.name;
              scp.selectedQuestion.categories = dt.topicObj.category;
              scp.selectedQuestion.topicId = dt.topicObj._id;
            } else {
              scp.selectedQuestion.topics = scp.selectedQuestion.topics + ', ' + dt.topicObj.name;
              scp.selectedQuestion.categories = scp.selectedQuestion.categories + ', ' + dt.topicObj.category;
              scp.selectedQuestion.topicId = scp.selectedQuestion.topicId + ', '+ dt.topicObj._id;
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
        self.$http({
          url: '/QuestionRequestHandler',
          data: {requestType: 'save', question: question},
          // dataType: 'json',
          method: 'post'
        }).then(function(results) {
          self.$uibModalInstance.dismiss('cancel');
          scp.QuestionManager.getQuestionJson();
        }, function errorCall(data) {
          //console.log(data);
        });
      }
    };

    EditModalManager.init({
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      $http: $http,
      $window: $window
    });
  }
]);
