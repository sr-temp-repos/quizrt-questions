var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var exclusionSchema = new Schema({
   word:String
});
module.exports = mongoose.model('ExclusionList', exclusionSchema,'exclusionList');
