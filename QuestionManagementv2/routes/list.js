var express = require('express');
var router = express.Router();

/* Post question Json listing. */
router.post('/', function(req, res, next) {
  console.log(req.body.questionURL);

  var json = JSON.parse(req.body.questionURL);
  console.log(json.slice(0,3));
  res.json(json);
});

module.exports = router;
