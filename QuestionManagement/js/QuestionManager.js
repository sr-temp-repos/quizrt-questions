(function() {
  var QuestionManager = {
    /* Intializes the config data into the object */
    init: function(config) {
      this.questionURL = config.questionURL;
      this.noOfQuestions = config.noOfQuestions;
      this.questionTemplateID = config.questionTemplateID;
      this.optionListTag=config.optionListTag;
      this.$formSection = config.$formSection;
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

      /* For generating Topics and Categories */
      Handlebars.registerHelper('generateTopicsCategory',function(results) {
        var optionsHTML = '',
            categories = [],
            topics = [];
        for( var i=0,len=results.topicId.length; i<=len; i++ ) {
          categories[i]=self.topics[result.topicId[i]].category;
          topics[i]=self.topics[result.topicId[i]].name;
        }
        return $('<div></div>')
                  .append($('<td></td>').text(topics))
                  .append($('<td></td>').text(categories))
                  .html();
      });
    },

    eventHandlers: function() {
      var self=this;
      // handle form submit event
      self.$formSection.submit(function(e) {
        e.preventDefault();
        var searchKeywords = new RegExp('\\b(' + self.$formSection.children('input')[0].value.replace(' ','|') + ')','ig');
        var results = $.grep( self.results, function(result, i) {
          return result.question.search(searchKeywords) > -1;
        });
        self.listQuestions(results);
      });
    },
    getTopicsJson: function() {
      var self=this;
      $.ajax({
        url: self.questionURL,
        dataType: 'json',
        method: 'post'
      }).done(function(results) {
        self.topics = results;
        getQuestionJson();
      };
    },
    getQuestionJson: function() {
      var self=this;
      $.ajax({
        url: self.questionURL,
        dataType: 'json',
        method: 'post'
      }).done(function(results) {
        self.results = results;
        self.registerHelpers();
        self.listQuestions(self.results);
      });
    },


    listQuestions: function(results) {
      var $questionTemplateID = $(this.questionTemplateID),
          hbTemplateFunction = Handlebars.compile( $questionTemplateID.html() ),
          filteredResults = results.slice( 0, this.noOfQuestions );
      this.questionList.slideToggle( 500 )
                          .empty()
                          .append( hbTemplateFunction( filteredResults ) )
                          .slideToggle( 500 );
    }
  };

  QuestionManager.init({
    questionURL: '/js/QuestionsJson/QuestionSample_2.json',
    topicsURL: '/js/QuestionsJson/Topics_v1.json'
    noOfQuestions: 10,
    questionTemplateID: '#template',
    $questionContainer: $('#questionList'),
    optionListTag: '<li></li>',
    $formSection: $('#searchForm')
  });
})();
