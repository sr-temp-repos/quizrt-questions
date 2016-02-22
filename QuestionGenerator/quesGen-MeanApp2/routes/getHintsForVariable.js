var express = require('express');
var router = express.Router();
//Load the request module
var request = require('request');

/* GET home page. */
router.post('/', function(req, res, next) {
  var searchString=req.body.data;
  var searchUri='https://www.wikidata.org/w/api.php?action=wbsearchentities&search='+searchString+'&language=en&format=json';
  // console.log(searchUri);
  request(searchUri, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        res.send(body);
        // console.log(body); // Show the HTML for the Modulus homepage.
    }
});

});

module.exports = router;
