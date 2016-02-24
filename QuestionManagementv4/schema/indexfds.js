var express = require('express');
var wagner = require('wagner-core');

require('./models')(wagner);

var app = express();

app.use('/api/v1', require('./api')(wagner));

app.listen(9080);
console.log('Listening on port 9080!');
