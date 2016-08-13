var http = require('http');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var cheerioReq = require('cheerio-req');
var scrapeIt = require("scrape-it")
var naea = require('./naea.model');
var zip = require('./zip.model');
var eaLead = require('./ealead.model');
var postal = require('./postal.model');
var ptinId = require('./ptinId.model');



//router.get('/ptin/start', function(req, res){
router.post('/ptin/start', function(req,res){	
	//postal.find().exec(function(err, zips){
	//	if(err){
	//		console.log('could not get the zip codes')
	//	}else{
	//		console.log('got zip codes');
			var saveIds = function(element){
				var url = 'https://www.ptindirectory.com/search-tax-preparers.cfm?last_name=&credentials=&services=&industries=&languages=&city=&state=&zip=' + element + '&startrow=1';
				scrapeIt(url, {
					Professionals:{
						listItem: '.searchtable tr td',
						data: {
							link: {
								selector: 'a',
								attr: 'href'
							},
							name: 'a'
						}
					},
					pages: '.searchnav:nth-last-child(2) a'
				}, (err, page)=>{
					console.log(err || page);
					// Add the link ID to the database
					var saveLink = function(result){
						var newPtin = new ptinId();
						newPtin.link = result.link;
						newPtin.name = result.name;
						console.log(newPtin);
						newPtin.save(function(err, ptinid){
							if(!err){console.log('Successfully saved PTIN ID'); }
							else{console.log('could not saved ptin ID'); console.log(err)}
						})
					}
					page.Professionals.forEach(saveLink);
					for(i = 2; i < page.pages; i++){
						var pUrl = 'https://www.ptindirectory.com/search-tax-preparers.cfm?last_name=&credentials=&services=&industries=&languages=&city=&state=&zip=' + element + '&startrow=' + i;
						scrapeIt(pUrl, {
							Professionals:{
								listItem: '.searchtable tr td',
									data: {
										link: {
											selector: 'a',
											attr: 'href'
										},
										name: 'a'
									}
							}
						}, (err, pPage)=>{
							console.log(err||pPage)
							pPage.Professionals.forEach(saveLink);
						})
					}

				})
			}
			/*
			var checkNumber = function(provided){
				if(isNaN(provided.code)){
					postal.findByIdAndRemove(postal._id, function(err, garbage){
						if(err){console.log('could not remove the garbage')}
						else{console.log('removed garbage: ' + garbage)}
					})
				}else if(provided )
			}*/
			var zipCodes = req.body.url;
			zips = zipCodes.split(' ');
			zips.forEach(saveIds);

			res.send('pay attention to the shell log')
	//	}
	//})
});

module.exports = router;