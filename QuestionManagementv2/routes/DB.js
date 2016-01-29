var mongoose = require('mongoose'),
    questionSchema = require('../schema/question'),
    topicSchema = require('../schema/topic'),
    categorySchema = require('../schema/category'),
    _ = require('underscore');

module.exports.QuestionDB = {
  init: function(wagner, config) {
    this.wagner = wagner;
    for(var cfg in config) {
      cfg = cfg + '';
      this[cfg] = config[cfg];
    }
    mongoose.connect(this.connectionURL);
    var Question =
      mongoose.model('Question', questionSchema, this.collection[0]);
    var Topic =
      mongoose.model('Topic', topicSchema, this.collection[1]);
    var Category =
      mongoose.model('Category', categorySchema, this.collection[2]);

    var models = {
      Question: Question,
      Topic: Topic,
      Category: Category
    };

    // To ensure DRY-ness, register factories in a loop
    _.each(models, function(value, key) {
      wagner.factory(key, function() {
        return value;
      });
    });
  },
  find: function(Question, query, callback) {

    Question.find({}).populate({
      path: 'topicIds',
      model: 'Topics',
      populate: {
        path: 'category',
        model: 'Category'
    }}).limit(5).find(query, function(err, doc) {
      if(err) {
        console.log(err);
      }
      console.log(doc[0].topicIds);
    }).exec(function(err, doc) {
      if(err) {
        console.log(err);
        callback(err,null);
      }
      for(var i = 0, doclen = doc.length; i<doclen; i++) {
        var topics = [],
            categories = [],
            topicId = [],
            topicIds = doc[i].topicIds;
        for(var index=0, len= topicIds.length; index<len; index++) {
          topics.push(topicIds[index].name);
          categories.push(topicIds[index].category.name);
          topicId.push(topicIds[index]._id);
        }
        doc[i].topics = topics.join(', ');
        doc[i].categories = categories.join(', ');
        doc[i].topicId = topicId.join(', ');
      }
      callback(null,doc);
    });
  }
};

module.exports.TopicDB = {
  init: function(config) {
    // for(var cfg in config) {
    //   cfg = cfg + '';
    //   this[cfg] = config[cfg];
    // }
  }
};

module.exports.init = module.exports.QuestionDB.init;
