(function() {
  var QuestionManager {
    /* Intializes the config data into the object */
    init: function(config) {
      this.url = config.url;
      this.noOfQuestions = config.noOfQuestions;
      this.questionTemplateID = config.questionTemplateID;
      this.getQuestionJson();
    },
    registerHelpers: function() {
      var self = this;
      Handlebars.registerHelper('generateOptions',function(results,index) {
        var optionsHTML = '';
        for( var i=1;i<=12;i++ ) {
          if( results[index]['option' + i] ) {
            optionsHTML += $( self.optionListTag ).text(results[index]['option' + i]).html();
          } else {
            break;
          }
        }
        return optionsHTML;
      });
    }
    getQuestionJson: function() {
      var self=this;
      $.ajax({
        url: self.url,
        dataType: json,
        method: post
      }).done(function(results) {
        self.results = results;
        self.registerHelpers();
        self.listQuestions();
      });
    },


    listQuestions: function() {
      var hbTemplateFunction = Handlebars.compile( $(this.questionTemplateID).html() );
      var filteredResults = this.results.slice( 0, this.noOfQuestions );
      hbTemplateFunction( filteredResults );
    }
  };

  QuestionManager.init({
    url: '/js/QuestionsJson/',
    noOfQuestions: 10,
    questionTemplateID: '#Template',
    optionListTag: '<li></li>'
  })
})();
