var mongoose = require('mongoose');

var topicSchema = {
  _id: { type: String, required: true },
  name: { type: String, required: true},
  category: { type: String, required: true}
};

module.exports = new mongoose.Schema(topicSchema);
module.exports.topicSchema = topicSchema;
