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
  list: function(Question, query, callback) {
    Question.find({}).populate({
      path: 'topicIds',
      model: 'Topics',
      populate: {
        path: 'category',
        model: 'Category'
    }}).find(query).exec(function(err, doc) {
      var topics = [],
          categories = [],
          topicId = [],
          topicIds = doc[0].topicIds;
      if(err) {
        console.log(err);
        callback(err,null);
      }

      for(var index=0, len= topicIds.length; index<len; index++) {
        topics.push(topicIds[index].name);
        categories.push(topicIds[index].category.name);
        topicId.push(topicIds[index]._id);
      }
      doc[0].topics = topics.join(', ');
      doc[0].categories = categories.join(', ');
      doc[0].topicId = topicId.join(', ');
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
