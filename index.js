'use strict'

var fs = require('fs');
var morgan = require('morgan');
var https = require('https');
var express = require('express');

var app = express();

app.use(morgan('combined'));

app.get('/', function (req, res, next) {
	res.send('Hello world');
});

app.get('*', function (req, res) {
	res.redirect('https://' + req.headers.host + req.url);
});

var options = {
	key: fs.readFileSync(__dirname + '/certs/key.pem');
	cert: fs.readFileSync(__dirname + '/certs/cert.pem');
};

process.on('uncaughtException', function (err) {
	console.error(err);
});

https.createServer(options, app).listen(8000);