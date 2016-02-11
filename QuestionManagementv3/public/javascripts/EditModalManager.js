(function() {
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
    }
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
  // addTopic: function(self,e) {
  //   var textEntered = $(this).closest('div').find('input')[0].value,
  //       $addBtn = $(this),
  //       topicWellfunction = Handlebars.compile($(self.topicWellTemplate).html()),
  //       $topicIdsHidden = $(self.topicIds)[0],
  //       $categories = $(self.categories);
  //   $.ajax({
  //     url: '/TopicsRequestHandler',
  //     data: {requestType: 'checkTopic', checkExist: textEntered  },
  //     dataType: 'json',
  //     method: 'post'
  //   }).done(function(results) {
  //     if(results.status==='success'){
  //       var $topicsWell = $(self.topicsWell),
  //           len = $topicsWell.find('.topics').length;
  //
  //       $topicIdsHidden.value += (($topicIdsHidden.value.length > 0)? ', ':'') + results.topicObj.topicId;
  //       $categories.html((($categories.html().trim().length > 0)? $categories.html() + ', ' : '') + results.topicObj.category);
  //       var newWell = $(topicWellfunction([results.topicObj.name])).find('.close').on('click',function(e) {
  //         self.onTopicWellClose.call(this,self);
  //       }).end();
  //       $topicsWell.append(newWell);
  //       $($topicsWell.find('.topics')[len]).data('topicId',len);
  //     }
  //     else {
  //       $(self.messageArea).html(self.messages['newTopic']).slideDown();
  //       $(self.newTopicForm).slideDown();
  //       $addBtn.fadeOut();
  //       $(self.topicName).attr('disabled',true);
  //     }
  //   });
  // },
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
        //var len = scp.selectedQuestion.topicIds.length;
        // scp.newTopic(scp.topicName,dt.topicObj.category);
      } else {
        scp.messageSelect = 2;
        scp.newCategoryForm = true;
        scp.newTopicObj = dt.topicObj;
      }
    });
    // var $addCategoryTxt = $(this).closest('div').find('input')[0],
    //     textEntered = $addCategoryTxt.value,
    //     $newTopicForm = $(self.newTopicForm),
    //     $newCategoryForm = $(self.newCategoryForm),
    //     $topicIdsHidden = $(self.topicIds)[0],
    //     $categories = $(self.categories),
    //     topicWellfunction = Handlebars.compile($(self.topicWellTemplate).html());
    // $.ajax({
    //   url: '/TopicsRequestHandler',
    //   data: {requestType: 'checkCategory', checkExist: textEntered, newTopicName: $(self.topicName)[0].value },
    //   dataType: 'json',
    //   method: 'post'
    // }).done(function(results) {
    //   if(results.status==='success') {
    //     var $topicsWell = $(self.topicsWell),
    //         len = $topicsWell.find('.topics').length;
    //
    //     $topicIdsHidden.value += (($topicIdsHidden.value.length > 0)? ', ':'') + results.topicObj.topicId;
    //     $categories.html((($categories.html().trim().length > 0)? $categories.html() + ', ' : '') + results.topicObj.category);
    //     var newWell = $(topicWellfunction([results.topicObj.name])).find('.close').on('click',function(e) {
    //       self.onTopicWellClose.call(this,self);
    //     }).end();
    //     $topicsWell.append(newWell);
    //     $(self.messageArea).slideUp().removeClass('text-danger');
    //     $($topicsWell.find('.topics')[len]).data('topicId',len);
    //     $newTopicForm.slideUp();
    //     $(self.addTopicId).fadeIn();
    //     $(self.topicName).attr('disabled',false);
    //   } else {
    //   //  console.log($(self.messageArea).removeClass('text-danger'));
    //     $(self.messageArea).html(self.messages['newCategory']).removeClass('text-danger');
    //     $($addCategoryTxt).attr('disabled',true);
    //     $newTopicForm.find(':button').fadeOut();
    //     $newCategoryForm.slideDown();
    //     $newCategoryForm.data('topicObj', results.topicObj);
    //   }
    // });
  },
  cancelCategoryIdClicked: function(self) {
    var scp = self.$scope;
    scp.newTopicForm = false;
    scp.messageSelect = 0;
    // $(self.addTopicId).fadeIn();
    // $(self.newTopicForm).slideUp();
    // $(self.topicName).attr('disabled',false);
    // $(self.messageArea).slideUp();
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
      // var scp = self.$scope;

      // var $newCategoryForm = $(self.newCategoryForm),
      //     $newTopicForm = $(self.newTopicForm),
      //     $topicIdsHidden = $(self.topicIds)[0],
      //     $categories = $(self.categories),
      //     $addCategoryTxt = $newTopicForm.find('input')[0],
      //     topicObj = $newCategoryForm.data('topicObj');
      //
      // $.ajax({
      //   url: '/TopicsRequestHandler',
      //   data: {requestType: 'addTopicCategory', newTopicObj: topicObj },
      //   dataType: 'json',
      //   method: 'post'
      // }).done(function(results) {
      //
      //   if(results.status === 'success') {
      //     var $topicsWell = $(self.topicsWell),
      //         len = $topicsWell.find('.topics').length;
      //
      //     $topicIdsHidden.value += (($topicIdsHidden.value.length > 0)? ', ':'') + results.topicObj.topicId;
      //     $categories.html((($categories.html().trim().length > 0)? $categories.html() + ', ' : '') + results.topicObj.category);
      //     var newWell = $(topicWellfunction([results.topicObj.name])).find('.close').on('click',function(e) {
      //       self.onTopicWellClose.call(this,self);
      //     }).end();
      //     $topicsWell.append(newWell);
      //     $($topicsWell.find('.topics')[len]).data('topicId',len);
      //     $newCategoryForm.slideUp();
      //     $newTopicForm.slideUp();
      //     $(self.messageArea).slideUp();
      //     $($addCategoryTxt).attr('disabled',false);
      //     $(self.addTopicId).fadeIn();
      //     $(self.topicName).attr('disabled',false);
      //     $newTopicForm.find(':button').fadeIn();
      //   }
      //   else {
      //     $(self.messageArea).html(self.messages['error']).addClass('text-danger');
      //     $newCategoryForm.slideUp();
      //     $($addCategoryTxt).attr('disabled',false);
      //     $newTopicForm.find(':button').fadeIn();
      //   }
      // });
  },
  noBtnClicked: function(self) {
      var scp = self.$scope;
      scp.newCategoryForm = false;
      scp.messageSelect = 1;
      // var $newCategoryForm = $(self.newCategoryForm),
      //     $newTopicForm = $(self.newTopicForm),
      //     $topicIdsHidden = $(self.topicIds)[0],
      //     $categories = $(self.categories),
      //     $addCategoryTxt = $newTopicForm.find('input')[0];
      //
      // $newCategoryForm.slideUp();
      // $($addCategoryTxt).attr('disabled',false);
      // $newTopicForm.find(':button').fadeIn();
      // $(self.messageArea).html(self.messages['newTopic']).removeClass('text-danger');
  },
  newTopic : function(self,topic,category)  {
      var scp = self.$scope,
          obj = {
                  name : topic,
                  category : category
                };
      self.$http({
        url: '/TopicsRequestHandler',
        data: {requestType: 'addNewTopic', topicObj: obj },
        method: 'post'
      }).then(function(results) {
          console.log(results);
      });


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
  },
  editQuestionFormSubmit: function(self,e) {
    var $self = $(this),
        $correctIndexinForm = $self.find('input[type="number"]')[0],
        $hiddenTopicIds = $self.find('input[type="hidden"]')[2],
        $textArea = $self.find('textArea'),
        exit = false;

    // On save click
    function isEmpty(val,$this,e) {
      if(val === '') {
        $this.focus();
        e.preventDefault();
        return true;
      }
      return false;
    }
    $textArea.each(function(index) {
      var $this = $(this);
      if(isEmpty($this[0].value,$this,e)) {

        if(index>0) {
          var $selectedTab = $($('.tab')[index-1]);
              $selectedDiv = $selectedTab.closest('div.form-group');

          $selectedTab.click();
          $($selectedDiv.find('textArea')[index-1]).focus();
        }
        exit = true;
      }
    });
    if(exit)
      return;
    if(isEmpty($correctIndexinForm.value,$correctIndexinForm,e))
      return;
    if(isEmpty($hiddenTopicIds.value.replace(/\s/g,''),$(self.topicName),e))
      return;
    $(self.lastEdited)[0].value = self.getCurrentDate();
    e.preventDefault();

    var data = $self.serialize();
    $.ajax({
      url: '/QuestionRequestHandler',
      data: data,
      dataType: 'json',
      method: 'post'
    }).done(function(result) {
      //console.log(result);
      var alertHandleFunction = Handlebars.compile($(self.alertTemplateID).html()),
          $alertArea = $('.alert');
      // Check Alert Area exits
      if($alertArea.length > 0 ) {
        $alertArea.slideUp(500,function(){
          $alertArea.remove();
          $(alertHandleFunction(result)).insertAfter(self.$searchWell).slideDown(500);
        });
      } else {
        $(alertHandleFunction(result)).insertAfter(self.$searchWell).slideDown(500);
      }
    });

    $modal.modal('hide');
    $modal.remove();
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  }

};
window.EditModalManager = EditModalManager;
})();
