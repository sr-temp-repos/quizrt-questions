var mongoose = require('mongoose');

var topicSchema = {
  _id: { type: String, required: true,ref: 'topic' },
  name: { type: String, required: true,ref: 'topic' },
  category: { type: String, required: true,ref: 'topic' }
};

module.exports = new mongoose.Schema(topicSchema);
module.exports.topicSchema = topicSchema;
