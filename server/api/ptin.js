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
var eaLead = require('./phone.model');
var postal = require('./postal.model');
var ptinId = require('./ptinIdss.model');
var donePostal = require('./donePostal.model');
var endPtin = require('./endPtin.model')


router.get('/ptin/start', function(req, res){
//router.post('/ptin/start', function(req,res){	
	postal.find().sort({'_id': -1}).limit(25).exec(function(err, zips){
		if(err){
			console.log('could not get the zip codes')
		}else{
			console.log('got zip codes');
			var saveIds = function(element){
				var url = 'https://www.ptindirectory.com/search-tax-preparers.cfm?last_name=&credentials=&services=&industries=&languages=&city=&state=&zip=' + element.code + '&startrow=1';
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
					if(!err){
						var usedPostal = new donePostal();
						usedPostal.code = element.code;
						usedPostal.save(function(err, donepost){
							if(!err){
								console.log('moved to other collections');
								postal.findByIdAndRemove(element._id, function(err, oldpost){
									if(!err){console.log('success removed')}
								})
							}
						})
					}
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
						var pUrl = 'https://www.ptindirectory.com/search-tax-preparers.cfm?last_name=&credentials=&services=&industries=&languages=&city=&state=&zip=' + element.code + '&startrow=' + i;
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
			//zips = zipCodes.split(' ');
			
			zips.forEach(saveIds);
			//var zipCodes = req.body.url;
			
			//zips.forEach(saveIds);

			res.redirect('/naea');
		}
	})
});


router.get('/ptin/havoc', function(req,res){
	console.log('about to be over for the world')
	ptinId.find().sort({'_id': -1}).limit(75).exec(function(err, ptinids){
		var sendToScrape = function(element){
			console.log('about to send to scrape link: ' + element.link)
			if(typeof element.link !== 'undefined'){
				var str = element.link
				var id = str.slice(36);
				if(id.length > 5) {
					// start what we do with id
					var url = 'https://www.ptindirectory.com/tax-preparer-listing.cfm?cpa_dir_id=' + id
					var page = '';
					var number = ''
					cheerioReq(url, (err, $)=>{
						page = $('td.text').text();

						if(page.includes('Phone')){
							console.log(page);
							var location = page.search('Phone');
							number = page.slice(location + 7,location + 19);console.log(number);

							var newNumber = new eaLead()
							newNumber.number = number;
							newNumber.save(function(err, ealead){
								if(err){
									console.log(err); 
									console.log('Failed the saving scrape')}
								else{
									console.log('added the lead number'); 
									var newComplete = new endPtin();
									newComplete.link = element.link;
									newComplete.name = element.name;
									newComplete.phone = number;
									newComplete.save((err,complete)=>{
										if(err){console.log('could not move to complete')}
										else{
											console.log('moved to complete');
											ptinId.findByIdAndRemove(element._id, function(err, theid){
												if(!err){console.log('finally done with this one')}
												else{
													console.log('could not delete this one.')
												}
											})
										}
									})

									//res.redirect('/zip')
								}
							})

						}else{
							console.log('page doesnt have phone')
						}
					})
					// end what we do with id
				} else {
					//fs.writeFile('scrape/ptinIds/' + element._id + '.json', JSON.stringify(element, null, 4), (err)=>{console.log('created file with the one')})
					console.log('this no bueno')
				}
				
			}else{
				console.log('something is wrong with the link: ' +element.link)
			}
			
		};
		ptinids.forEach(sendToScrape);
	})
})

// scrape the individual page
router.get('/ptin/getPhone/:id', function(req, res){
	var code = req.params.id;
	var url = 'https://www.ptindirectory.com/tax-preparer-listing.cfm?cpa_dir_id=' + code;
	var page = '';
	var number = '';


	cheerioReq(url, (err, $)=>{
		page = $('td.text').text();

		if(page.includes('Phone')){
			console.log(page);
			var location = page.search('Phone');
			number = page.slice(location + 7,location + 19);console.log(number);

			var newNumber = new eaLead()
			newNumber.number = number;
			newNumber.save(function(err, ealead){
				if(err){console.log(err); res.send('Failed the saving scrape')}
				else{console.log('added the lead number'); res.send('You scraped this')}
			})

		}else{
			console.log('page doesnt have phone')
		}

		
		
		

	});
	console.log('saved number: ' + number);


})
module.exports = router;