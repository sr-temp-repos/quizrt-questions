(function() {
  var QuestionManager = {
    /* Intializes the config data into the object */
    init: function(config) {
      this.url = config.url;
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
    },

    eventHandlers: function() {
      var self=this;
      // handle form submit event
      self.$formSection.submit(function(e) {
        e.preventDefault();
        var searchKeywords = new RegExp('\\b(' + self.$formSection.children('input')[0].value.replace(' ','|') + ')','ig');
        //console.log(searchKeywords);
        var results = $.grep( self.results, function(result, i) {
//          console.log(i + ' ' + result.question.search(searchKeywords) );
          return result.question.search(searchKeywords) > -1;
        });
        self.listQuestions(results);
//        console.log(results);

      });
    },

    getQuestionJson: function() {
      var self=this;
      $.ajax({
        url: self.url,
        dataType: 'json',
        method: 'post'
      }).done(function(results) {
        self.results = results;
        self.registerHelpers();
        self.listQuestions(self.results);
      });
    },


    listQuestions: function(results) {
      console.log(this.questionTemplateID);
      var $questionTemplateID = $(this.questionTemplateID),
          hbTemplateFunction = Handlebars.compile( $questionTemplateID.html() ),
          filteredResults = results.slice( 0, this.noOfQuestions );
      console.log(filteredResults);
      $('div.panel-group').empty().append( hbTemplateFunction( filteredResults ) );
    }
  };

  QuestionManager.init({
    url: '/js/QuestionsJson/QuestionSample_2.json',
    noOfQuestions: 10,
    questionTemplateID: '#template',
    optionListTag: '<li></li>',
    $formSection: $('#search')
  });
})();
