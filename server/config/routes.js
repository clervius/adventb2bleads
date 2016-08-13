var path = require('path');
var express = require('express');

module.exports = function(app){

	app.get('/naea*', require('../api/naea'));

	app.post('/naea*', require('../api/naea'));

	app.get('/zip', function(req, res){
		res.render('zip');
	})
	app.post('/zip*', require('../api/zips'))
	app.post('/ptin*', require('../api/ptin'));
	app.get('/ptin*', require('../api/ptin'))
}