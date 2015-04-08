var express = require('express');
var app = express();
var path = require('path');

app.use('/lib', express.static(path.join(__dirname, '../../lib')));
app.use('/', express.static(path.join(__dirname, '../../dist')));

var server = app.listen(1234, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Dev server listening at http://%s:%s', host, port);
});
