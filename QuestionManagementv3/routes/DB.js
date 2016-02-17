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
  add: function(Question, questions, callback) {
    for(var index in questions) { // Looping each question in questions array
      questions[index].topicIds = questions[index].topicId.split(', '); // Generating ids from questions.topicid
      questions[index].topicId = ''; //clearing all other temp variables
      questions[index].topics = '';
      questions[index].categories = '';

      var q = new Question(questions[index]); // validating with schema
      q.save(function(err) { // saving the data
        callback(err);
      });
    }
  },
  getCount: function(Question, query, callback) {
    Question.count(query,function(err,doc) {
      callback(err, doc);
    });
  },
  find: function(Question, searchSettings, callback) {
    var query = searchSettings.query===""? {}: {name : searchSettings.query};
    searchSettings.wagner.invoke(searchSettings.db.CategoryDB.find, {
      query: query,
      callback: function(err, docs) {
        query: searchSettings.query===""? {}: {name : searchSettings.query};
        if(docs.length > 0) {
          categoryIds = docs.map(function(doc) { return doc._id });
          query= rgexQuery !== ""? { $or : [ {name : searchSettings.query}, {category: {$in: categoryIds}} ] }: {};
        }

        searchSettings.wagner.invoke(searchSettings.db.TopicDB.findTopics, {
          query: query,
          callback: function(err, docs) {
            query= searchSettings.query===""? {}: {question : searchSettings.query};
            if(docs.length > 0) {
              topicIds = docs.map(function(doc) { return doc._id });
              query= rgexQuery !== ""? { $or : [ {question : searchSettings.query}, {topicIds: {$in: topicIds}} ] }: {};
            }
            Question.find(query)
              .sort(searchSettings.sortObj)
              .populate({
                path: 'topicIds',
                model: 'Topics',
                populate: {
                  path: 'category',
                  model: 'Category'
                }
              }).exec(function(err, doc) {
                if(err) {
                  callback(err,null);
                  return;
                }

                for(var i = 0, doclen = doc.length; i<doclen; i++) {
                  var topics = [],
                      categories = [],
                      topicId = [],
                      topicIds = doc[i].topicIds;
                  for(var index=0, len = topicIds.length; index<len; index++) {
                    topics.push(topicIds[index].name);
                    categories.push(topicIds[index].category.name);
                    topicId.push(topicIds[index]._id);
                  }
                  doc[i].topics = topics.join(', ');
                  doc[i].categories = categories.join(', ');
                  doc[i].topicId = topicId.join(', ');
                }

                var jsonData = {
                  rows: doc.slice(searchSettings.firstQuestion, searchSettings.firstQuestion + searchSettings.count ),
                  firstQuestion: searchSettings.firstQuestion,
                  count: doc.length
                };
                callback(null,jsonData);
              });
          }
        });
      }
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
  list: function(Topic, callback) {
    Topic.find({}, function(err, doc) {
      callback(err,doc);
    });
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
  },
  findTopics: function(Topic, query, callback) {
    Topic.find(query, function(err, doc) {
      callback(err,doc);
    });
  },
  getCount: function(Topic, callback) {
    Topic.find({}).populate({
      path: 'category',
      model: 'Category'
    }).count(function(err,doc) {
      callback(err, doc);
    });
  },
  addTopic: function(Topic,topicObj,callback) {
    var t = new Topic(topicObj);
    t.save(function(err){
      callback(err);
    });
  }
};

module.exports.CategoryDB = {
  find: function(Category, query, callback) {
    if(!query)
      query = {};
    Category.find(query, function(err, doc) {
      callback(err,doc);
    });
  },
  list: function(Category, callback) {
    Category.find({}, function(err, doc) {
      callback(err,doc);
    });
  },
  getCount: function(Category, callback) {
    Category.find({}).count(function(err,doc) {
      callback(err, doc);
    });
  },
  addCategory: function(Category,categoryObj,callback) {
    var c = new Category(categoryObj);
    c.save(function(err){
      callback(err);
    });
  }
};

module.exports.init = module.exports.QuestionDB.init;
