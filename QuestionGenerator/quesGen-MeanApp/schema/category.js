var mongoose = require('mongoose');

var categorySchema = {
  _id: { type: String, required: true},
  name: { type: String, required: true},
  imageUrl: { type: String },
};

module.exports = new mongoose.Schema(categorySchema);
