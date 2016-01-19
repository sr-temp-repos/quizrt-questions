var express = require('express');
var router = express.Router();
var fs = require('fs');

function readJSONFile(filename, callback) {
  fs.readFile(filename, function (err, data) {
    if(err) {
      callback(err);
      return;
    }
    try {
      callback(null, JSON.parse(data));
    } catch(exception) {
      callback(exception);
    }
  });
}

router.post('/', function(req, res, next) {
  readJSONFile("public/" + req.body.questionURL, function(err, json) {
    res.json(json);
  });

});
module.exports = router;
