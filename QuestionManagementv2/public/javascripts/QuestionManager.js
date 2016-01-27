(function() {
  var QuestionManager = {

    /* Intializes the config data into the object */
    init: function(config) {
      $.extend(this,config);
      //$(this.templateDiv).load(this.templateFile);
      this.getQuestionJson();
      this.eventHandlers();
    },

    registerHelpers: function() {
      var self = this;
      Handlebars.registerHelper('generateOptions',function(results) {
        var optionsHTML = '',
            optionArray = [],
            generateOptionsHandlebarFunction = Handlebars.compile($(self.generateOptionsTemplate).html());
        for( var i=1;i<=12;i++ ) {
          if( results['option' + i] ) {
            optionArray[i] = results['option' + i];
          } else {
            break;
          }
        }
        return generateOptionsHandlebarFunction(optionArray);
      });

      Handlebars.registerHelper('generateTpcs', function(topicId) {
        var topics = topicId.split(',');
            topicWellfunction = Handlebars.compile($(self.topicWellTemplate).html());
        return topicWellfunction(topics);
      });
      Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
          if (arguments.length < 3)
              throw new Error("Handlebars Helper equal needs 2 parameters");
          if( lvalue!=rvalue ) {
              return false;
          } else {
              return true;
          }
      });
      Handlebars.registerHelper('getMax', function(result) {
        for( var i=1;i<=12;i++ ) {
          if( result['option' + i] ) {
          } else {
            break;
          }
        }
        return i-1;
      });
    },

    eventHandlers: function() {
      var self=this;
      // handle search form submit and reset event
      self.$formSection.submit(function(e) {
        e.preventDefault();
        $.ajax({
          url: '/QuestionRequestHandler',
          data: {requestType: 'search', query: self.$formSection.children('input')[0].value},
          dataType: 'json',
          method: 'post'
        }).done(function(results) {
          self.redraw(results);
        });
      });
      self.$formSection.on('reset', function(e) {
        self.$formSection.children('input')[0].value = "";
        self.$formSection.submit();
      });
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
      var self=this;
      $.ajax({
        url: '/QuestionRequestHandler',
        data: {requestType: 'list'},
        dataType: 'json',
        method: 'post'
      }).done(function(results) {
        self.results = results;
        self.draw(self.results);
        self.registerHelpers();
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
          modalHandler = Handlebars.compile($(self.modalTemplateID).html()),
          dataListHandler = Handlebars.compile($(self.topicDataListTemplate).html()),
          categoryListHandler = Handlebars.compile($(self.categoryDataListTemplate).html());

      $modal = $(modalHandler(self.results[questionNumber])).insertAfter(self.$pageNo);
      $modal.modal('show');
       $('[data-toggle="tooltip"]').tooltip();

      $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var $target = $($(e.target).attr("href")).find('textArea'); // activated tab
        $target.focus();
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
    onQuestionDelete: function(self) {
      var questionNumber = $(this).data('rowId'),
          pageNo = self.$pageNo.data('pageNo')-1,
          selectedRowCount = self.$dropDownId.data('selectedRowCount');

      //sending request to server for delete operation
      $.ajax({
        url: '/QuestionRequestHandler',
        data: {requestType: 'delete', questionId: (questionNumber + pageNo * selectedRowCount)},
        dataType: 'json',
        method: 'post'
      }).done(function(result) {
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

        if(result.status == 'success') {
          self.results.splice(questionNumber,1);
          self.redraw(self.results);
        }
      });
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

  QuestionManager.init({
    /* Json URL */
    questionURL: 'javascripts/QuestionsJson/QuestionSample_3.json',
    // topicsURL: '/js/QuestionsJson/Topics_v1.json',

    /* Template to use for placing question and question container */
    templateFile: 'templates.html',
    templateDiv: '#loadTemplates',
    questionTemplateID: '#questionTbl',
    dropdownTemplateID: '#dropdownTmp',
    modalTemplateID: '#modalTmp',
    alertTemplateID: '#alertTmp',
    generateOptionsTemplate: '#generateOptionsTmp',
    topicWellTemplate: '#topicWellTmp',

    $questionContainer: $('#questionList'),
    optionListTag: '<div></div>',

    /* Search from object for submit event */
    $formSection: $('#searchForm'),
    editQuestionForm: '#editQuestion',

    /* Edit and Delete Button */
    editBtn: 'button.command-edit',
    deleteBtn: 'button.command-delete',
    addTopicId: '#addTopicId',
    addCategoryId: '#addCategories',
    cancelCategoryId: '#cancelCategories',
    yesBtn: '#yesBtn',
    noBtn: '#noBtn',

    /* Dropdown options */
    noOfQuestions: [10, //first one default
                    25,
                    50,
                    'All'],
    $dropDownId: $('#noOfQuestions'),
    $pageNo: $('#pageNo'),
    /* Pagination Settings */
    noOfPaginations: 5, // no of paginations Visible

    /* filter ID for redrawing filter options */
    questionListHeader: '#questionList-header',
    $searchWell: $('div#search'),

    /* topics */
    topicsClass: '.topics',
    topicsWell: '#topicsWell',
    topicIds: '#topicIds',
    topicName: '#topicName',
    categories: '#categories',
    newTopicForm: '#newTopicForm',
    newCategoryForm: '#newCategoryForm',
    messageArea: '#messageArea',
    lastEdited: '#lastEdited',

    /* Message Array for Topic management */
    messages: {
      newTopic : 'Topic that was entered is new, please tag it with some category',
      newCategory: 'Category that was entered is new, please comfirm as requested below',
      error: 'Failed to insert new Topic and Category, please try again'
    },

  });
})();
