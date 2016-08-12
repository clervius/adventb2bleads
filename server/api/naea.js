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
var fullcontact = require('fullcontact').createClient('b2bc30d1a1b76234');
var clearbit = require('clearbit')('sk_7de0e5c765a2ea1aee796ba03ee74a0f');


router.post('/naea/start', function(req,res){
	zip.find().exec(function(err, zips){
		console.log('there are ' + zips.length +' Zip codes to do.');
		//var zipCodes = [];
		//zipCodes.push(zips);
		var move = function(element){
			var newCode = new postal();
			newCode.code = element.code;
			newCode.save(function(err, post){
				if(!err){
					console.log('saved ' + post.code);

					var scraping = function(what){
						var url = 'http://taxexperts.naea.org/listing/results.php?dist=15&zip=' + what;
						var scrape = function(link){
							console.log('strating the scrape for: ' + link);
							scrapeIt(url, {
								Professionals: {
									listItem: "#content_listView > div",
									data: {
										name: "h3 a",
										phone: ".summary-contact .text-right span[id^='phoneNumber']",
										website: {
											selector: ".summary-contact a[title='Visit Website']",
											attr: 'href'
										},
										saddress: ".summary-address address span",
										address2: ".summary-address address p small"
									}
								},
								pages: "ul.pages li:nth-last-child(2) a"
							}, (err, page)=>{
								console.log(err || page);
								var saveIt = function(result){
									var newProfessional = new eaLead();
									newProfessional.name = result.name;
									newProfessional.website = result.website;
									newProfessional.phone = result.phone;
									newProfessional.number = result.phone.replace(/[- )(]/g,'');
									newProfessional.address = result.saddress + ', ' + result.address2;
									console.log('adding to db');
									newProfessional.save(function(err, ealead){
										console.log(err|| 'saved the lead');
									});
								}
								page.Professionals.forEach(saveIt);	
								for(i = 2; i <= page.pages; i++){
									var pUrl = 'http://taxexperts.naea.org/listing/results.php?dist=15&zip=' + zip + '&screen=' + i;
									console.log('scraping for page - ' +pUrl); 
									// start
									scrapeIt(pUrl, {
										Professionals: {
											listItem: "#content_listView > div",
												data: {
													name: "h3 a",
													phone: ".summary-contact .text-right span[id^='phoneNumber']",
													website: {
														selector: ".summary-contact a[title='Visit Website']",
														attr: 'href'
													},
													saddress: ".summary-address address span",
													address2: ".summary-address address p small"
												}
										}
									}, (err, came)=>{
										console.log(err||came);
										came.Professionals.forEach(saveIt);
									})
								}							
							})
						}
					};

					scraping(post.code);
					zip.findByIdAndRemove(element._id, function(err, zipCode){
						if(err){console.log('could not delete this zip code')}
						else{console.log('deleted ' + zipCode.code)}
					});
				}else{
					console.log('could not move it to postal db, not doing it.');
				}
			})
		};
		// add function here for each
		zips.forEach(move);
	})
});


router.get('/naea/scrape', function(req, res){

	
	
	
	
	var zipScrape = function(zip){
		console.log('scraping for: ' + zip.code)
		url = 'http://taxexperts.naea.org/listing/results.php?dist=15&zip=' + zip.code + '&screen=2';
		scrapeIt(url, {
			Professionals: {
				listItem: "#content_listView > div",
				data: {
					name: "h3 a",
					phone: ".summary-contact .text-right span[id^='phoneNumber']",
					website: {
						selector: ".summary-contact a[title='Visit Website']",
						attr: 'href'
					},
					saddress: ".summary-address address span",
					address2: ".summary-address address p small"
				}
			},
			pages: "ul.pages li:nth-last-child(2) a"
		}, (err, page)=> {
			console.log(err || page);
			console.log('scraped for: ' + zip)
			var saveIt = function(element){
				var newProfessional = new naea();
				newProfessional.name = element.name;
				newProfessional.website = element.website;
				newProfessional.phone = element.phone;
				newProfessional.number =  element.phone.replace(/[- )(]/g,'');
				newProfessional.address = element.saddress + ', ' + element.address2;
				console.log('adding to db');

				newProfessional.save(function(err, naea){
					if(err){console.log('could not save naea' + err)}
					else{ console.log('naea saved to db'); console.log('saved '+zip+' to db')}
				})

			}
			page.Professionals.forEach(saveIt);
			console.log('finished the one for: ' + zip);
			for(i = 3; i <= page.pages; i++){
				var pUrl = 'http://taxexperts.naea.org/listing/results.php?dist=15&zip=' + zip + '&screen=' + i;
				console.log('scraping for page - ' +pUrl)
				scrapeIt(pUrl, {
					Professionals: {
						listItem: "#content_listView > div",
							data: {
								name: "h3 a",
								phone: ".summary-contact .text-right span[id^='phoneNumber']",
								website: {
									selector: ".summary-contact a[title='Visit Website']",
									attr: 'href'
								},
								saddress: ".summary-address address span",
								address2: ".summary-address address p small"
							}
					}
				}, (err, result)=>{
					console.log(err||result);
					//console.log('scraped page ' + i + 'for ' + pUrl);
					result.Professionals.forEach(saveIt);
				})
			}			
			
		});
	};

	postal.find().exec(function(err, postcodes){
		if(!err){
			postcodes.forEach(zipScrape);
		}else{
			console.log('could not do it!')
		}
	})
	//codes.forEach(zipScrape)
	

/*
	url = 'http://taxexperts.naea.org/listing/results.php?dist=15&zip=' + req.body.url;
	console.log('about to scrape from ' + url);
	scrapeIt(url, {
		Professionals : {
			listItem: "#content_listView > div",
			data: {
				name: "h3 a",
				phone: ".summary-contact .text-right span[id^='phoneNumber']",
				website: {
					selector: ".summary-contact a[title='Visit Website']",
					attr: 'href'
				},
				saddress: ".summary-address address span",
				address2: ".summary-address address p small"
			}
		}
	}, (err, page) => {
		console.log(err || page);
		var saveIt = function(element){
			var newProfessional = new naea();
			newProfessional.name = element.name;
			newProfessional.website = element.website;
			newProfessional.phone = element.phone;
			newProfessional.number =  element.phone.replace(/[- )(]/g,'');
			newProfessional.address = element.saddress + ', ' + element.address2;
			console.log('adding to db');

			newProfessional.save(function(err, naea){
				if(err){console.log('could not save naea' + err)}
				else{ console.log('naea saved to db'); }
			})

		}
		fs.writeFile('scrape/naea/zip_' + url.slice(59,65) + '.json', JSON.stringify(page, null, 4), (err)=>{console.log('created file for zip ' + url.slice(59,65))})
		page.Professionals.forEach(saveIt);

	});*/
	res.redirect('/naea');
});


router.get('/naea', function(req, res){
	res.render('naea');
})

module.exports = router;