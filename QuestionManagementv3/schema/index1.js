var mongoose = require('mongoose');
var schema = require('./schema');

mongoose.connect('mongodb://localhost/test');

// Parameters are: model name, schema, collection name
var User = mongoose.model('User', schema, 'users');

var user = new User({
  name: 'John Smith',
  email: 'john@smith.io'
});

user.save(function(error) {
  if (error) {
    console.log(error);
    process.exit(1);
  }
  User.find({ email: 'john@smith.io' }, function(error, docs) {
    if (error) {
      console.log(error);
      process.exit(1);
    }
    console.log('Found docs:');
    docs.forEach(function(doc) {
      console.log(JSON.stringify(doc));
    });
    process.exit(0);
  });
});
