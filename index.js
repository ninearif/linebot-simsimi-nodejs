'use strict'
const line = require('node-line-bot-api')
const express = require('express')
const bodyParser = require('body-parser')
const lineClient = line.client
const lineValidator = line.validator
const app = express()
const request = require('superagent');
const fs = require('fs')
const https = require('https')
const hostname = process.env.HOSTNAME || 'localhost';
const simsimiAPIKey = '<YOUR_SIMSIMI_API_KEY}>';
const simsimiLanguageCode = 'th';

app.use(bodyParser.json({
  verify (req, res, buf) {
    req.rawBody = buf
  }
}))

app.set('port', (process.env.PORT || 9000));

const options = {
  ca:   fs.readFileSync('cert/<YOUR_CA>.crt'),
  key:  fs.readFileSync('cert/<YOUR_KEY>.key'),
  cert: fs.readFileSync('cert/<YOUR_CERT>.crt'),
  requestCert: true,
  rejectUnauthorized: false
};

// init with auth
line.init({
  accessToken: '<YOUR_ACCESS_TOKEN>',
  channelSecret: '<YOUR_CHANNEL_SECRET>'
})

app.post('/linewebhook', line.validator.validateSignature(), (req, res, next) => {
  // get content from request body
  	const promises = req.body.events.map(event => {
		if (event.replyToken && event.message.text) {
			console.log("Input: " + event.message.text);
			request
			.get('http://sandbox.api.simsimi.com/request.p?key=' + simsimiAPIKey +
				'&text=' + encodeURIComponent(event.message.text) +
				'&lc=' + simsimiLanguageCode)
			.end(function(err, resSimi){
				if(!err){
					console.log("Reply: " + resSimi.body.response)
					if(resSimi.body.response != undefined){
						return line.client
				      	.replyMessage({
					        replyToken: event.replyToken,
					        messages: [
					          	{
						            type: 'text',
						            text: resSimi.body.response
					          	}
					        ]
					    })
					  	Promise
					    .all(promises)
					  	.then(() => {
					  		res.json({success: true})
					  	})
					}
					else{
						//When simsimi return undefined
						return line.client
				      	.replyMessage({
					        replyToken: event.replyToken,
					        messages: [
					          	{
						            type: 'text',
						            text: '<YOUR_TEXT_TO_HANDLE>'
					          	}
					        ]
					    })
					  	Promise
					    .all(promises)
					  	.then(() => {
					  		res.json({success: true})
					  	})	
					}
				}
				else{
					err;
				}
			});
	    }
	    else{
	    	//When incorrect input
	    	return line.client
	      	.replyMessage({
		        replyToken: event.replyToken,
		        messages: [
		          	{
			            type: 'text',
			            text: '<YOUR_TEXT_TO_HANDLE>'
		          	}
		        ]
		    })
		  	Promise
		    .all(promises)
		  	.then(() => {
		  		res.json({success: true})
		  	})
	    }
	})
})

https.createServer(options, app).listen(app.get('port'), function(){
  console.log("Server running on https://%s:%s", hostname, app.get('port'));
});
