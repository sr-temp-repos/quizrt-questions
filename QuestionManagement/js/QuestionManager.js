(function() {
  var QuestionManager = {
    /* Intializes the config data into the object */
    init: function(config) {
      this.questionURL = config.questionURL;
      this.topicsURL = config.topicsURL;
      this.questionTemplateID = config.questionTemplateID;
      this.optionListTag=config.optionListTag;
      this.$formSection = config.$formSection;
      this.$questionContainer = config.$questionContainer;
      this.dateSeparator = config.dateSeparator;
      this.$question = config.$question;
      this.getTopicsJson();
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
              return result.question.search(searchKeywords) > -1 || result.topicId.search(searchKeywords) > -1 || result.topicId.search(searchKeywords) > -1;
            });
        self.listQuestions(results);

      });

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

    getTopicsJson: function() {
      var self=this;
      $.ajax({
        url: self.topicsURL,
        dataType: 'json',
        method: 'post'
      }).done(function(results) {
        self.topics = results;
        self.getQuestionJson();
      })
    },

    listQuestions: function(results) {
      var $questionTemplateID = $(this.questionTemplateID),
          hbTemplateFunction = Handlebars.compile( $questionTemplateID.html() );

      console.log(this.$questionContainer);
      this.$questionContainer.slideToggle( 500 )
            .bootgrid('clear')
            .bootgrid('append', results )
            .slideToggle( 500 );

    }
  };

  QuestionManager.init({
    /* Json URL */
    questionURL: '/js/QuestionsJson/QuestionSample_3.json',
    topicsURL: '/js/QuestionsJson/Topics_v1.json',

    /* Template to use for placing question and question container */
    questionTemplateID: '#template',
    $questionContainer: $('#questionList'),
    // optionListTag: '<li></li>',

    /* Search from object for submit event */
    $formSection: $('#searchForm'),

    /* Question Selection Toggle */
    $question: $('.question-row'),

    /* date Separator for configuring date separation */
    dateSeparator: '/'
  });
})();
