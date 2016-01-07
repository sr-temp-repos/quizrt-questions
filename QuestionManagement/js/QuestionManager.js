(function() {
  var QuestionManager = {
    /* Intializes the config data into the object */
    init: function(config) {
      this.url = config.url;
      this.noOfQuestions = config.noOfQuestions;
      this.questionTemplateID = config.questionTemplateID;
      this.optionListTag=config.optionListTag;
      this.getQuestionJson();
    },
    registerHelpers: function() {
      var self = this;
      Handlebars.registerHelper('generateOptions',function(results) {
        var optionsHTML = '';
        for( var i=1;i<=12;i++ ) {
          if( results['option' + i] ) {
            optionsHTML += $('<div></div>').append($(self.optionListTag).text(results['option' + i])).html();
            console.log(optionsHTML);
          } else {
            break;
          }
        }
        //console.log(optionsHTML);
        return optionsHTML;
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
        self.listQuestions();
      });
    },


    listQuestions: function() {
      var $questionTemplateID = $(this.questionTemplateID),
      hbTemplateFunction = Handlebars.compile( $questionTemplateID.html() );
      filteredResults = this.results.slice( 0, this.noOfQuestions );
      $('div.panel-group').append( hbTemplateFunction( filteredResults ) );
    }
  };

  QuestionManager.init({
    url: '/js/QuestionsJson/QuestionSample_1.json',
    noOfQuestions: 100,
    questionTemplateID: '#template',
    optionListTag: '<li></li>'
  });
})();
