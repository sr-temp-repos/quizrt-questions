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
  getCount: function(Question,query, callback) {
    Question.find({}).populate({
      path: 'topicIds',
      model: 'Topics',
      populate: {
        path: 'category',
        model: 'Category'
      }
    }).count(query,function(err,doc) {
      callback(err, doc);
    });
  },
  find: function(Question, query, firstQuestion, count, sortObj, callback) {

    Question.find({}).sort(sortObj).skip(firstQuestion).limit(count).populate({
      path: 'topicIds',
      model: 'Topics',
      populate: {
        path: 'category',
        model: 'Category'
      }
    }).find(query).exec(function(err, doc) {
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
  },
  delete: function(Question,id,callback) {
    Question.remove({ _id : id }).exec(function(err,doc){
    if(err){
      console.log(err);
      callback(err,null);
    }
    callback(null,doc);
    });
  },
  save: function(Question,question,callback) {
    // console.log(question.lastEdited);
    question.lastEdited = new Date();
    question.topicIds = question.topicId.split(', ');
    question.topics = "";
    question.categories = "";
    // console.log(question.lastEdited);
    var q = new Question(question);
    var upsertData = q.toObject();
    delete upsertData._id;
    Question.update({ _id : question._id },upsertData,{upsert: true},function(err,doc){
      if(err){
        console.log(err);
        callback(err,null);
      }
      // console.log();
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
  },
  list: function(Topic, callback) {
    Topic.find({}, function(err, doc) {
      callback(err,doc);
    })
  },
  findTopic: function(Topic, query, callback) {
    Topic.find(query).populate({
      path: 'category',
      model: 'Category'
    }).exec(function(err, doc) {
      if(doc.length==1) {
        doc[0].category = doc[0].category.name;
        callback(err,doc);
      } else {
        callback(err,null);
      }
    });
  }
};

module.exports.CategoryDB = {
  find: function(Category, query, callback) {
    if(query)
      query = {};
    Category.find({query}, function(err, doc) {
      callback(err,doc);
    });
  }
};

module.exports.init = module.exports.QuestionDB.init;
