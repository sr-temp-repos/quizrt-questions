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
        var optionsHTML = '';
        for( var i=1;i<=12;i++ ) {
          if( results['option' + i] ) {
            var $optionInput = $('<div></div>').append($('<label></label>', {
              for: 'option' + i
            }).text('Option ' + i)).append($('<input></input>', {
              type: 'text',
              class: 'form-control',
              name: 'option' + i,
              id: 'option' + i,
              value: results['option' + i]
            }));
            optionsHTML += $('<div></div>').append($(self.optionListTag,{class: 'form-group'}).html($optionInput.html())).html();
            //console.log(optionsHTML);
          } else {
            break;
          }
        }
        //console.log(optionsHTML);
        return optionsHTML;
      });
      Handlebars.registerHelper("currentDate", function() {
        return new Date().toString('dd/MM/yyyy');
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
    listQuestions: function(results) {
      var $questionContainer = this.$questionContainer,
          self = this,
          questionHandler = Handlebars.compile($(this.questionTemplateID).html());


      $questionContainer.children('tbody').empty().append(questionHandler(results));
      // handle question edit, delete and view events
      $(self.editBtn).on('click', function(e) {
        var rowId = $(this).data('rowId'),
            pageNo = self.$pageNo.data('pageNo')-1,
            selectedRowCount = self.$dropDownId.data('selectedRowCount'),
            questionNumber = (rowId + pageNo * selectedRowCount),
            modalHandler = Handlebars.compile($(self.modalTemplateID).html());
        $modal = $(modalHandler(self.results[questionNumber])).insertAfter(self.$pageNo);
        $modal.modal('show');
        $('[data-dismiss=modal]').on('click',function(e){
            $modal.modal('hide');
            $modal.remove();
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        });
      });
      $(self.deleteBtn).on('click', function(e) {
        // var questionNumber = $(this).data('questionId');
        var questionNumber = $(this).data('rowId'),
            pageNo = self.$pageNo.data('pageNo')-1,
            selectedRowCount = self.$dropDownId.data('selectedRowCount');
        //(questionNumber + pageNo * selectedRowCount)},
        $.ajax({
          url: '/QuestionRequestHandler',
          data: {requestType: 'delete', questionId: (questionNumber + pageNo * selectedRowCount)},
          dataType: 'json',
          method: 'post'
        }).done(function(result) {
          var $alertArea = "";
          result= JSON.parse(result);
          if(result.status == 'success') {
            $alertArea = $('<div></div>', {
              class: 'alert alert-success'
            }).insertAfter(self.$searchWell).html( '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
                          result.message);
            self.results = $.grep(self.results, function(result, i) {
              return i!=questionNumber;
            });
            self.redraw(self.results);
          } else { // Handling error status
            $alertArea = $('<div></div>', {
              class: 'alert alert-failure'
            }).insertAfter(self.$searchWell).html( '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
                          result.message);
          }
          $alertArea.slideDown();
        });
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
    $questionContainer: $('#questionList'),
    optionListTag: '<div></div>',

    /* Search from object for submit event */
    $formSection: $('#searchForm'),

    /* Alert Area */
    $alertArea: $('#alertArea'),

    /* Edit and Delete Button */
    editBtn: 'button.command-edit',
    deleteBtn: 'button.command-delete',

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
    $searchWell: $('div#search')
  });
})();
