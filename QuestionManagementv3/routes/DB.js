var mongoose = require('mongoose'),
    questionSchema = require('../schema/question'),
    topicSchema = require('../schema/topic'),
    categorySchema = require('../schema/category'),
    _ = require('underscore'),
    fs = require('fs');

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
  add: function(Question, callback) {
      var stream = fs.createReadStream("../tempFileToStoreQues.json", {flags: 'r', encoding: 'utf-8'});
      var buf = '';
      var inserted = 0;
      var notInserted = 0;

      stream.on('data', function(d) {
        buf += d.toString(); // when data is read, stash it in a string buffer
        pump(); // then process the buffer
      });

      function pump() {
        var pos;

        while ((pos = buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
            if (pos == 0) { // if there's more than one newline in a row, the buffer will now start with a newline
                buf = buf.slice(1); // discard it
                continue; // so that the next iteration will start with data
            }
            processLine(buf.slice(0,pos)); // hand off the line
            buf = buf.slice(pos+1); // and slice the processed data off the buffer
        }
      }

      function processLine(line) { // here's where we do something with a line

        if (line[line.length-1] == '\r') line=line.substr(0,line.length-1); // discard CR (0x0D)

        if (line.length > 0) { // ignore empty lines
            var obj = JSON.parse(line); // parse the JSON
            Question.find({questionId: obj.questionId}, function(err, docs) {
              if(docs.length == 0) {
                obj["difficultyLevel"] = 0;
                obj["timesUsed"] = 0;
                obj["correctRatio"] = "";
                obj["frequency"] = 0;
                obj["lastEdited"] = new Date();
                obj["createdOn"] = new Date();
                var q = new Question(obj); // validating with schema
                q.save(function(err) { // saving the data
                  if (err) {
                    notInserted++;
                  } else {
                    inserted++;
                  }
                  // callback(err);
                });
              }
              else {
                notInserted++;
              }
            });
        }
      }
      callback(null, inserted+notInserted, inserted, notInserted);
  },
  getCount: function(Question, query, callback) {
    Question.count(query,function(err,doc) {
      callback(err, doc);
    });
  },
  /*
    This function used for following purpose
    - Listing: listing indicated by empty query string
    - Searching
  */
  find: function(Question, searchSettings, callback) {
    var query='',
        retEmpty=false;
    /* checks whether request is for searching */
    if (searchSettings.query !='' && (searchSettings.searchIn.cat || searchSettings.searchIn.all)){
      query = {name : searchSettings.query}; // Query search when search settings allows
    } else {
      retEmpty = true; // Don't search any thing in Category DB
    }
    searchSettings.wagner.invoke(searchSettings.db.CategoryDB.find, {
      query: query,
      retEmpty: retEmpty,
      callback: function(err, docs) {
        query = '';
        retEmpty = false;
        /* Checks whether request is for searching */
        if(searchSettings.query !='' && (searchSettings.searchIn.top || searchSettings.searchIn.all)) {
          /* Searching topics is required */
          if(docs.length > 0 ) {
            /* query for searching topics and categories */
            var categoryIds = docs.map(function(doc) { return doc._id });
            query = { $or : [ {name : searchSettings.query}, {category: {$in: categoryIds}} ] };
          }
          else /* Searching only for topics */
            query = {name : searchSettings.query};

        } else if (docs.length > 0 ){ // topics not selected but categories is selected
            var categoryIds = docs.map(function(doc) { return doc._id });
            query = {category: {$in: categoryIds}};
        } else {
          retEmpty = true;
        }

        searchSettings.wagner.invoke(searchSettings.db.TopicDB.findTopics, {
          query: query,
          retEmpty: retEmpty,
          callback: function(err, docs) {
            query = '';
            retEmpty = false;
            /* Checks whether request is for searching */
            if(searchSettings.query !='' && (searchSettings.searchIn.ques || searchSettings.searchIn.all)) {
              /* Searching topics is required */
              if(docs.length > 0 ) {
                /* query for searching topics and question */
                var topicIds = docs.map(function(doc) { return doc._id });
                query = { $or : [ {question : searchSettings.query}, {topicIds: {$in: topicIds}} ] };
              }
              else /* Searching only for question */
                query = {question : searchSettings.query};

            } else if (docs.length > 0 ) { // question not selected but topics exists is selected
                categoryIds = docs.map(function(doc) { return doc._id });
                query = {topicIds: {$in: categoryIds}};
            } else if (searchSettings.query !=''){
              var jsonData = {
                rows: [],
                firstQuestion: searchSettings.firstQuestion,
                count: 0
              };
              callback(null,jsonData);
              return;
            } else {
              query = {};
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
                var count = doc.length;

                doc = doc.slice(searchSettings.firstQuestion, searchSettings.firstQuestion + searchSettings.count);
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
                  rows: doc,
                  firstQuestion: searchSettings.firstQuestion,
                  count: count
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
  findTopic: function(Topic, retEmpty, query, callback) {
    if(retEmpty) { // no search required only callback
      callback(null,[]);
      return;
    }

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
  findTopics: function(Topic, retEmpty, query, callback) {
    if(retEmpty) {
      callback(null,[]);
      return;
    }
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
  find: function(Category, retEmpty, query, callback) {
    if(retEmpty) { // no search required only callback
      callback(null,[]);
      return;
    }

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
