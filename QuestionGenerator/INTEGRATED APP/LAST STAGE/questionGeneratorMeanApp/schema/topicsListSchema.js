var mongoose = require('mongoose');
var category = require('./category');

var Category = mongoose.model('Category', category, 'Categories');

  var topicSchema = {
    _id: { type: String, required: true},
    name: { type: String, required: true},
    imageUrl: { type: String },
    category: { type: String, required: true, ref: 'Category'}
  };
var topicsSchema=new mongoose.Schema(topicSchema);
module.exports = mongoose.model('topicsListSchema', topicsSchema,'Topics');
