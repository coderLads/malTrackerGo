var express = require('express');
var request = require('request');


var app = express();
app.use('/proxy', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var url = req.url.replace('/?url=', '');
    req.pipe(request(url)).pipe(res);
});

app.listen(process.env.PORT || 8123);