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
var noPhone = require('./noPhone.model')
var weirdPtin = require('./ptinId.model')
var badPostal = require('./badPostal.model');
var smsDone = require('./smsPhone.model');
var smsBad = require('./noSMS.model')
var text = require('textbelt');
var Nexmo = require('simple-nexmo');
var nexmo = new Nexmo({
	  apiKey: '1fc028ac',
	  apiSecret: 'af15098e569c71a0',
	  useSSL: true,
	  debug: false
});
var twilio = require('twilio')
var tclient = new twilio.RestClient('AC5fd75ef19aeb1977b16dc2804784e4ac', 'bc336be44f5df4e06cef314662093b4f');


router.get('/ptin/sendSms', function(req,res){
	eaLead.find().sort({'_id': -1}).limit(200).exec(function(err, phones){
		if(err){
			console.log('there was an error getting 50 numbers');
		}else{
			console.log('got the numbers');
			var sendText = function(element){
				var theNumber = element.number.replace(/-/g,'')
				console.log(theNumber)
				
				tclient.messages.create({
					body:'Tax Professionals, dominate your area and make more money next season! Find out how: https://www.moretaxleads.com',
					to: theNumber,
					from: '9546035838'
				}, function(err, message){
					if(err && err.message !== "Too Many Requests"){
						console.log(err);
						console.log('could not text')
						var newBadNum = new smsBad()
						newBadNum.number = theNumber;
						newBadNum.error = err;
						newBadNum.save(function(err,badnum){
							if(!err){
								console.log('saved bad num, now removing')
								eaLead.findByIdAndRemove(element._id, function(err,removed){
									if(!err){
										console.log('removed bad num')
									}else{
										console.log('couldnt remove bad num,' + err)
									}
								})
							}else{
								console.log('error saving this bad num')
								console.log(err)
							}
						})
					}if(err && err.message == "Too Many Requests"){
						console.log('too many requests... chilling with this num')
					}else{
						console.log(message);
						console.log('texted');
						var newgoodNum = new smsDone();
						newgoodNum.number = theNumber;
						newgoodNum.save(function(err,num){
							if(!err){
								console.log('saved num');
								eaLead.findByIdAndRemove(element._id, function(err,phone){
									if(!err){
										console.log('saved and removed good num')
									}else{
										console.log(err)
									}
								})
							}else{
								console.log(err);

							}
						})
					}
				});
				
			}
			phones.forEach(sendText);
			res.redirect('/zip');
		}
	})
});


router.get('/ptin/start', function(req, res){
//router.post('/ptin/start', function(req,res){	
	postal.find().sort({'_id': -1}).limit(45).exec(function(err, zips){
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
					}else{
						var newbadPostal = new badPostal();
						newbadPostal.code = element.code;
						newbadPostal.save((err,savedpostal)=>{
							if(!err){
								console.log('moved the bad postal code');
								postal.findByIdAndRemove(element._id,(err,deletedpost)=>{
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
	ptinId.find().sort({'_id': -1}).limit(200).exec(function(err, ptinids){
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
						if(!err){
							page = $('td.text').text();

							if(page.includes('Phone') && page.length){
								console.log(page);
								var location = page.search('Phone');
								number = page.slice(location + 7,location + 19);console.log(number);

								var newNumber = new eaLead()
								newNumber.number = number;
								newNumber.save(function(err, ealead){
									if(err){
										console.log(err); 
										console.log('Failed the saving scrape');

									}
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

							}else if(page.length && !page.includes('Phone')){
								console.log('page doesnt have phone')
								var newnophone = new noPhone();
								newnophone.name = element.name;
								newnophone.link = element.link;
								newnophone.save((err,nphone)=>{
									if(err){console.log('could not move this nophone')}
									else{
										console.log('moved somewhere else to deal with later, deleting...');
										ptinId.findByIdAndRemove(element._id, (err,thisPtin)=>{
											if(err){
												console.log('could not remove this ptin')
											}else{
												console.log('deleted ptin without number')
											}
										})
									}
								})
							}else{
								var newWeird = new weirdPtin();
								newWeird.name = element.name;
								newWeird.link = element.link;
								newWeird.save((err,thisPtin)=>{
									if(err){console.log('could not save this weird ptin')}
									else{
										console.log('saved this weird ptin');
										ptinId.findByIdAndRemove(element._id, (err, ohno)=>{
											if(!err){console.log('deleted this weird ptin. Deal with it later')}
											else{console.log('could not delete this weird ptin.')}
										})
									}
								})
							}
						}else{
							console.log(err);
							console.log('could not go on')
						}
					})
					// end what we do with id
				} else {
					//fs.writeFile('scrape/ptinIds/' + element._id + '.json', JSON.stringify(element, null, 4), (err)=>{console.log('created file with the one')})
					console.log('This code is too short, needs to be checked');
					var newWeird = new weirdPtin();
							newWeird.name = element.name;
							newWeird.link = element.link;
							newWeird.save((err,thisPtin)=>{
								if(err){console.log('could not save this weird ptin')}
								else{
									console.log('saved this weird ptin');
									ptinId.findByIdAndRemove(element._id, (err, ohno)=>{
										if(!err){console.log('deleted this weird ptin. Deal with it later')}
										else{console.log('could not delete this weird ptin.')}
									})
								}
							})
				}
				
			}else{
				console.log('something is wrong with the link: ' +element.link);
				var newWeird = new weirdPtin();
							newWeird.name = element.name;
							newWeird.link = element.link;
							newWeird.save((err,thisPtin)=>{
								if(err){console.log('could not save this weird ptin')}
								else{
									console.log('saved this weird ptin');
									ptinId.findByIdAndRemove(element._id, (err, ohno)=>{
										if(!err){console.log('deleted this weird ptin. Deal with it later')}
										else{console.log('could not delete this weird ptin.')}
									})
								}
							})

			}
			
		};
		ptinids.forEach(sendToScrape);
		res.redirect('/zip');
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

router.get('/ptin/cleanPhone', function(req, res){
	endPtin.find().sort({'_id':-1}).limit(100).exec((err,thisOne)=>{})
});

router.get('/ptin/cleanZips', function(req, res){
	var finished = '';
	var notfinished = '';

	postal.find().exec((err, postals)=>{
		if(!err){
			console.log('Got old zip codes. There are: ' + postals.length + ' of them.')
			notfinished = postals
		}else{
			console.log('could not get old zip codes')
		}
	});

	donePostal.find().exec((err, postCode)=>{
		if(!err){
			console.log('got the done postcodes, there are: ' + postCode.length + ' of them.');
			console.log('initiating clean sequence...');
			var compareandRemove = function(element){
				var compare = function(item){
					if(item.code === element.code){
						postal.findByIdAndRemove(element._id, (err, dup)=>{
							if(!err){
								console.log('successfully deleted duplicate')
							}else{
								console.log('could not delete duplicate')
							}
						})
					}
				}

				//finished.forEach(compare)
			}
			//notfinished.forEach(compareandRemove)

		}else{
			console.log('could not get the postcodes');
		}
	});

	for(var i = 0; i < Array.from(finished).length; i++){
		console.log('going through code: ' + finished[i].code);
		for(var j = 0; j < Array.from(notfinished).length; j++){
			if(finished[i].code === notfinished[j].code){
				postal.findByIdAndRemove(notfinished[j]._id, (err,thatcode)=>{
					if(err){console.log('could not remove duplicate code')}
					else{console.log('successfully removed duplicate code')}
				})
			}else{
				console.log('doesnt match')
			}
		}
	}
})

router.get('/ptin/sendtestText', function(req,res){
	console.log('about to send this text')
	var testOpts = {
		fromAddr: 'support@moretaxleads.com',
		fromName: 'Joram Clervius',
		region: 'us',
		subject: 'Dominate Your Market'
	}

	var testBody = 'Tax Professionals, dominate your area and make more money next season! Find out how: http://moretaxleads.com/needclients';
	text.debug(true);
	text.send('9543247726', testBody, undefined, function(){
		console.log('sent the text')
		res.redirect('/zip')
	})
})
module.exports = router;