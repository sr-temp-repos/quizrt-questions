var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = function(wagner) {
  mongoose.connect('mongodb://localhost/test');

  var Question =
    mongoose.model('Question', require('./question'), 'questions');
    var Topic =
      mongoose.model('Topic', require('./topic'), 'Topics');
    var Category =
      mongoose.model('Category', require('./category'), 'Categories');

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

    return models;
};
