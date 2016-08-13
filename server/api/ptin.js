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


router.get('/ptin/havoc', function(req,res){
	console.log('about to be over for the world')
	ptinId.find().exec(function(err, ptinids){
		var sendToScrape = function(element){
			console.log('about to send to scrape link: ' + element.link)
			if(typeof element.link !== 'undefined'){
				var str = element.link
				var id = str.slice(36);
				if(id.length > 5) {
					request('http://localhost:5100/ptin/getPhone/' + id, function(error, response, body){
						if(error){console.log('could not get it'); console.log(error)}
						else if(!error){ console.log(body);}
					});
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
			number = page.slice(location + 7,location + 20);console.log(number);

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