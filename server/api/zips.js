var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var cheerioReq = require('cheerio-req');
var scrapeIt = require("scrape-it")
var zip = require('./zip.model');
var fullcontact = require('fullcontact').createClient('b2bc30d1a1b76234');
var clearbit = require('clearbit')('sk_7de0e5c765a2ea1aee796ba03ee74a0f')

router.post('/zip/add', function(req, res){
	var codes = req.body.codes.split(' ');

	var saveCode = function(element){
		var saveElem = function(theCode){
			var newCode = new zip();
			newCode.code = theCode;
			newCode.save(function(err, zipCode){
				if(err){console.log('could not save this code:' + err)}
				else{console.log('saved: ' + zipCode)}
			})
		}
		
		if(element.length === 3){
			element = '00' + element;
			saveElem(element);
		}else if(element.length === 4){
			element = '0' + element;
			saveElem(element);
		}else {
			element = element;
			saveElem(element);
		}
		console.log('saving ' + element);

	};

	codes.forEach(saveCode);
	res.redirect('/zip');
})

router.post('/zip/clean', function(req, res){
	zip.find({$where: "this.code.length < 5"}).remove().exec(function(err){
		if(!err){
			console.log('deleted that!');
		}else{
			console.log('couldnt delete that!');
		}
	})
	res.redirect('/zip')
})
module.exports = router;