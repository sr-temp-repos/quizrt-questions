(function() {
  var QuestionManager = {

    /* Intializes the config data into the object */
    init: function(config) {
      $.extend(this,config);
      $(this.templateDiv).load(this.templateFile);
      this.getQuestionJson();
      this.eventHandlers();
    },

    registerHelpers: function() {
      var self = this;
      Handlebars.registerHelper('generateOptions',function(results) {
        var optionsHTML = '';
        for( var i=1;i<=12;i++ ) {
          if( results['option' + i] ) {
            optionsHTML += $('<div></div>').append($(self.optionListTag).text(results['option' + i])).html();
            //console.log(optionsHTML);
          } else {
            break;
          }
        }
        //console.log(optionsHTML);
        return optionsHTML;
      });
    },

    eventHandlers: function() {
      var self=this;
      // handle search form submit event
      self.$formSection.submit(function(e) {
        e.preventDefault();
        var searchKeywords = new RegExp('\\b(' + self.$formSection.children('input')[0].value.replace(' ','|') + ')','ig'),
            results = $.grep( self.results, function(result, i) {
              return result.question.search(searchKeywords) > -1 || result.topicId.search(searchKeywords) > -1 || result.categories.search(searchKeywords) > -1;
            });
        self.redraw(results);
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
        url: self.questionURL,
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
      // $questionContainer.bootgrid({
      //   ajax: 'true',
      //   url: this.questionURL,
      //   method: 'post',
      //   formatters: {
      //       "commands": function(column, row)
      //       {
      //           return "<button type=\"button\" class=\"btn btn-xs btn-default command-edit\"  style=\"font-size:22px; vertical-align:middle; line-height: 20px;\" data-row-id=\"" + row.questionId + "\"><span class=\"glyphicon glyphicon-pencil\"></span></button> " +
      //               "<button type=\"button\" class=\"btn btn-xs btn-default command-delete\"   style=\"font-size:22px; vertical-align:middle;  line-height: 20px;\" data-row-id=\"" + row.questionId + "\"><span class=\"glyphicon glyphicon-remove\"></span></button>";
      //       }
      //   }
      // }).on('loaded.rs.jquery.bootgrid', function(e){
      //   self.changeFilterPosition();
      //   self.$questionContainer.find(".command-edit").on("click", function(e)
      //   {
      //       alert("You pressed edit on row " + $(this).data("row-id"));
      //   }).end().find(".command-delete").on("click", function(e)
      //   {
      //       alert("You pressed delete on row: " + $(this).data("row-id"));
      //   });
      // });

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

            $pageTrk.html('Showing ' + firstQuestion + ' to ' + lastQuestion + ' of ' + results.length + ' Questions');
          }
      });
    }
  };

  QuestionManager.init({
    /* Json URL */
    questionURL: '/js/QuestionsJson/QuestionSample_3.json',
    // topicsURL: '/js/QuestionsJson/Topics_v1.json',

    /* Template to use for placing question and question container */
    templateFile: 'templates.html',
    templateDiv: '#loadTemplates',
    questionTemplateID: '#questionTbl',
    dropdownTemplateID: '#dropdownTmp',
    $questionContainer: $('#questionList'),
    // optionListTag: '<li></li>',

    /* Search from object for submit event */
    $formSection: $('#searchForm'),

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
