(function() {
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
      // Handlebars.registerHelper('generateOptions',function(results) {
      //   var optionsHTML = '',
      //       optionArray = [],
      //       generateOptionsHandlebarFunction = Handlebars.compile($(self.generateOptionsTemplate).html());
      //   for( var i=1;i<=12;i++ ) {
      //     if( results['option' + i] ) {
      //       optionArray[i] = results['option' + i];
      //     } else {
      //       break;
      //     }
      //   }
      //   return generateOptionsHandlebarFunction(optionArray);
      // });
      self.$scope.dateFormater = function(date) {
        var tDate = new Date(date);
        return tDate;
      }
      // Handlebars.registerHelper('generateTpcs', function(topicId) {
      //   var topics = topicId.split(',');
      //       topicWellfunction = Handlebars.compile($(self.topicWellTemplate).html());
      //   return topicWellfunction(topics);
      // });
      // Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
      //     if (arguments.length < 3)
      //         throw new Error("Handlebars Helper equal needs 2 parameters");
      //     if( lvalue!=rvalue ) {
      //         return false;
      //     } else {
      //         return true;
      //     }
      // });
      // Handlebars.registerHelper('getMax', function(result) {
      //   for( var i=1;i<=12;i++ ) {
      //     if( result['option' + i] ) {
      //     } else {
      //       break;
      //     }
      //   }
      //   return i-1;
      // });

    },

    eventHandlers: function() {
      var self=this;
      // handle search form submit and reset event
      // self.$formSection.submit(function(e) {
      //   e.preventDefault();
      //   $.ajax({
      //     url: '/QuestionRequestHandler',
      //     data: {requestType: 'search', query: self.$formSection.children('input')[0].value},
      //     dataType: 'json',
      //     method: 'post'
      //   }).done(function(results) {
      //     self.redraw(results);
      //   });
      // });
      // self.$formSection.on('reset', function(e) {
      //   self.$formSection.children('input')[0].value = "";
      //   self.$formSection.submit();
      // });
      self.$scope.onSearch= function(){
        self.getQuestionJson();
      };

      self.$scope.onReset= function(){
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
        // console.log(selectedQuestion._id);
        self.onQuestionDelete(self,selectedQuestion._id);
      };
      self.$scope.orderByMe = function(x) {
        self.$scope.myOrderBy = x;
      };
    },
    getCurrentDate: function() {
      var todayDate = new Date();
      var yyyy = todayDate.getFullYear().toString();
      var mm = (todayDate.getMonth()+1).toString(); // getMonth() is zero-based
      var dd  = todayDate.getDate().toString();
      return (dd[1]?dd:"0"+dd[0]) + '/' + (mm[1]?mm:"0"+mm[0]) + '/' + yyyy;
    },
    sliceResults: function(results, start) {
      start = start || 0;
      var selectedRowCount = this.$dropDownId.data('selectedRowCount');
      if(selectedRowCount!='All')
        return results.slice(start,start + selectedRowCount);
      else {
        return results;
      }
    },
    getQuestionJson: function() {
      var self=this,
          $scp = self.$scope;

      self.$http({
        url: '/QuestionRequestHandler',
        data: {requestType: 'search', firstQuestion: $scp.firstQuestion, count: $scp.selectedRowCount,query: $scp.searchText},
        // dataType: 'json',
        method: 'post'
      }).then(function(results) {
        var dt = results.data;
        $scp.questions = dt.rows;
        $scp.totalQuestions = dt.count;
        $scp.lastQuestion = $scp.firstQuestion + $scp.selectedRowCount;
        $scp.lastQuestion = ($scp.lastQuestion > $scp.totalQuestions)? $scp.totalQuestions : $scp.lastQuestion;
      }, function errorCall(data) {
        // console.log(data);
      });
    },
    onTopicWellClose: function(self) {
      var $topic = $(this).closest('div'),
          topicId = $topic.data('topicId'),
          $topicIdsHidden = $(self.topicIds)[0],
          $categories = $(self.categories),
          topicIdArray = $topicIdsHidden.value.replace(/\s/g,'').split(','),
          categoryArray = $categories.html().replace(/\s/g,'').split(',');

      $topic.remove();
      $(self.topicsClass).each(function(index){
        $(this).data('topicId',index);
      });
      topicIdArray.splice(topicId,1);
      categoryArray.splice(topicId,1);
      $topicIdsHidden.value = topicIdArray.join(', ');
      $categories.html(categoryArray.join(', '));
    },
    onQuestionEdit: function(self) {
      var rowId = $(this).data('rowId'),
          pageNo = self.$pageNo.data('pageNo')-1,
          selectedRowCount = self.$dropDownId.data('selectedRowCount'),
          questionNumber = (rowId + pageNo * selectedRowCount),
          modalHandler = Handlebars.compile($(self.modalTemplateID).html());

      $modal = $(modalHandler(self.results[questionNumber])).insertAfter(self.$pageNo);
      $modal.modal('show');
       $('[data-toggle="tooltip"]').tooltip();

      $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var $target = $($(e.target).attr("href")).find('textArea'); // activated tab
        $target.focus();
      });
      $.ajax({
        url: '/TopicsRequestHandler',
        data: {requestType: 'listTopics'},
        dataType: 'json',
        method: 'post'
      }).done(function(results) {
        var handler=Handlebars.compile($(self.datalistTemplate).html());
        $(handler(results)).appendTo($modal).attr('id','topicList');
      });
      $.ajax({
        url: '/TopicsRequestHandler',
        data: {requestType: 'listCategories'},
        dataType: 'json',
        method: 'post'
      }).done(function(results) {
        var handler=Handlebars.compile($(self.datalistTemplate).html());
        $(handler(results)).appendTo($modal).attr('id','categoryList');
      });
      //Click add button
      $(self.addTopicId).on('click', function(e) {
        EditModalManager.addTopic.call(this,self,e);
      });
      // Modal Form submission
      $(self.editQuestionForm).on('submit',function(e) {
        EditModalManager.editQuestionFormSubmit.call(this,self,e);
      });

      $(self.addCategoryId).on('click', function(e) {
        EditModalManager.addCategoryId.call(this,self,e);
      });

      $(self.yesBtn).on('click', function(e) {
        EditModalManager.yesBtnClicked.call(this,self,e);
      });

      $(self.noBtn).on('click',function(e) {
        EditModalManager.noBtnClicked.call(this,self,e);
      });

      $(self.cancelCategoryId).on('click', function(e) {
        EditModalManager.cancelCategoryIdClicked.call(this,self,e);
      });

      //Modal window force close
      $('[data-dismiss=modal]').on('click',function(e){
          $modal.modal('hide');
          $modal.remove();
          $('body').removeClass('modal-open');
          $('.modal-backdrop').remove();
      });

      $(self.topicsClass + ' .close').on('click',function(e) {
        self.onTopicWellClose.call(this,self)
      });
    },
    onQuestionDelete: function(self,id) {
      var scp = self.$scope;
      //console.log(scp);
      self.$http({
        url: '/QuestionRequestHandler',
        data: {requestType: 'delete', questionId: id},
        // dataType: 'json',
        method: 'post'
      }).then(function(results) {
        //console.log(results);
        self.getQuestionJson();
      }, function errorCall(data) {
        // console.log(data);
      });
      // var questionNumber = $(this).data('rowId'),
      //     pageNo = self.$pageNo.data('pageNo')-1,
      //     selectedRowCount = self.$dropDownId.data('selectedRowCount');
      //
      // //sending request to server for delete operation
      // $.ajax({
      //   url: '/QuestionRequestHandler',
      //   data: {requestType: 'delete', questionId: (questionNumber + pageNo * selectedRowCount)},
      //   dataType: 'json',
      //   method: 'post'
      // }).done(function(result) {
      //   var alertHandleFunction = Handlebars.compile($(self.alertTemplateID).html()),
      //       $alertArea = $('.alert');
      //
      //   // Check Alert Area exits
      //   if($alertArea.length > 0 ) {
      //     $alertArea.slideUp(500,function(){
      //       $alertArea.remove();
      //       $(alertHandleFunction(result)).insertAfter(self.$searchWell).slideDown(500);
      //     });
      //   } else {
      //     $(alertHandleFunction(result)).insertAfter(self.$searchWell).slideDown(500);
      //   }
      //
      //   if(result.status == 'success') {
      //     self.results.splice(questionNumber,1);
      //     self.redraw(self.results);
      //   }
      // });
    },
    listQuestions: function(results) {
      var $questionContainer = this.$questionContainer,
          self = this,
          questionHandler = Handlebars.compile($(this.questionTemplateID).html());
      $questionContainer.children('tbody').empty().append(questionHandler(results));

      // update question new edit, delete button with listeners
      $(self.editBtn).on('click', function() {
        self.onQuestionEdit.call(this, self);
      });
      $(self.deleteBtn).on('click', function() {
        self.onQuestionDelete.call(this, self);
      });
    },
    draw: function(results) {
      //console.log(this.dropdownTemplateID);
      var self = this,
          $dropBtn = self.$dropDownId.find('button')[0],
          $ul = self.$dropDownId.find('ul.dropdown-menu'),
          dropdownListHandler = Handlebars.compile($(self.dropdownTemplateID).html()),
          $ulPageNo = self.$pageNo.find('ul.pagination'),
          $pageTrk = self.$pageNo.find('p.pageTracker'),
          selectedRowCount = self.noOfQuestions[0],
          possibleNoOfPaginations = Math.ceil( results.length/selectedRowCount );

      /* Storing Caret for future redraws */
      self.dropBtnCaret = $dropBtn.innerHTML;

      /* Drawing Drop down button */
      $dropBtn.innerHTML = selectedRowCount + ' ' + self.dropBtnCaret;
      self.$dropDownId.data( 'selectedRowCount', selectedRowCount );
      $ul.append(dropdownListHandler(self.noOfQuestions));
      $('li.noofRows').on('click', function() {
        var rowCount = $(this).data('rowcount');
        self.redraw(results,rowCount);
      });

      /* Internal object for storing Pagination Object from twbsPagination plugin */
      self.paginationObj = self.createPagination($ulPageNo, $pageTrk, selectedRowCount, possibleNoOfPaginations, results);

    },
    redraw: function(results,rowCount) {
      var self = this,
          $dropBtn = self.$dropDownId.find('button')[0],
          $ulPageNo = self.$pageNo.find('ul.pagination'),
          $pageTrk = self.$pageNo.find('p.pageTracker'),
          selectedRowCount = (rowCount!='All')? (rowCount || self.$dropDownId.data('selectedRowCount')) : results.length,
          possibleNoOfPaginations = Math.ceil( results.length/selectedRowCount );


      /* Redrawing No of question dropdown button */
      $dropBtn.innerHTML = ( (rowCount!='All')? selectedRowCount : rowCount ) + ' ' + this.dropBtnCaret;
      self.$dropDownId.data( 'selectedRowCount', selectedRowCount);

      /* Redrawing table with help of Pagination */
      this.paginationObj.destroy();
      this.paginationObj = this.createPagination($ulPageNo, $pageTrk, selectedRowCount, possibleNoOfPaginations, results);
    },
    createPagination: function(element, $pageTrk, selectedRowCount, possibleNoOfPaginations, results) {
      var self = this;

      return new $.fn.twbsPagination.Constructor(element, {
          totalPages: possibleNoOfPaginations,
          visiblePages: this.noOfPaginations,
          first: '&laquo;',
          prev: '&lt;',
          next: '&gt;',
          last: '&raquo;',

          onPageClick: function (event, page) {
            var startQuestionNo = (page-1)*selectedRowCount,
                firstQuestion = (startQuestionNo + 1),
                lastQuestion = ((startQuestionNo)+selectedRowCount);

            lastQuestion = (lastQuestion > results.length)? results.length : lastQuestion;
            self.listQuestions( self.sliceResults( results,startQuestionNo ) );
            self.$pageNo.data('pageNo',page);
            $pageTrk.html('Showing ' + firstQuestion + ' to ' + lastQuestion + ' of ' + results.length + ' Questions');
          }
      });
    }
  };
  //
  // QuestionManager.init({
  //   /* Date Separator */
  //   dateSeparator : '/',
  //   /* Template variable */
  //   /* Template to use for placing question and question container */
  //   questionTemplateID: '#questionTbl',
  //   dropdownTemplateID: '#dropdownTmp',
  //   alertTemplateID: '#alertTmp',
  //   /* Templates for Modal window */
  //   modalTemplateID: '#modalTmp',
  //   generateOptionsTemplate: '#generateOptionsTmp',
  //   topicWellTemplate: '#topicWellTmp',
  //   datalistTemplate: '#datalistTmp',
  //   /* end of Templates */
  //
  //   /* Question List Grid */
  //   $questionContainer: $('#questionList'),
  //
  //   /* Search from object for submit event */
  //   $formSection: $('#searchForm'),
  //   editQuestionForm: '#editQuestion', /* Modal window form submission */
  //
  //   /* Edit and Delete Button */
  //   editBtn: 'button.command-edit',
  //   deleteBtn: 'button.command-delete',
  //
  //   /* Modal window buttons */
  //   addTopicId: '#addTopicId',
  //   addCategoryId: '#addCategories',
  //   cancelCategoryId: '#cancelCategories',
  //   yesBtn: '#yesBtn',
  //   noBtn: '#noBtn',
  //
    // /* Dropdown options */
    // noOfQuestions: [10, //first one default
    //                 25,
    //                 50,
    //                 'All'],
  //   $dropDownId: $('#noOfQuestions'),
  //   $pageNo: $('#pageNo'),
  //
  //   /* Pagination Settings */
  //   noOfPaginations: 5, // no of paginations Visible
  //
  //   /* used for displaying alert below */
  //   $searchWell: $('div#search'),
  //
  //   /* topics wells */
  //   topicsClass: '.topics',
  //
  //   /* Hidden Text box for storing topic ids */
  //   topicIds: '#topicIds',
  //   topicsWell: '#topicsWell',
  //
  //   /* Text box for Typing topics */
  //   topicName: '#topicName',
  //   /* Label with categories */
  //   categories: '#categories',
  //   /* if new topic found New Topic Form displayed */
  //   newTopicForm: '#newTopicForm',
  //   /* if new category found new category form displayed */
  //   newCategoryForm: '#newCategoryForm',
  //   /* messageArea for displaying messages in topic management */
  //   messageArea: '#messageArea',
  //   /* lastEdited hidden text for changing lastEdited date after submit */
  //   lastEdited: '#lastEdited',
  //
  //   /* Message Array for Topic management */
  //   messages: {
  //     newTopic : 'Topic that was entered is new, please tag it with some category',
  //     newCategory: 'Category that was entered is new, please comfirm as requested below',
  //     error: 'Failed to insert new Topic and Category, please try again'
  //   },
  //
  // });
  window.QuestionManager = QuestionManager;
})();
