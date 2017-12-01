'use strict';

let mongoose = require('mongoose');
let User = mongoose.model('Users');
let crypto = require('crypto');
let expressJWT = require('express-jwt');
let jwt = require('jsonwebtoken');

exports.list_all_users = function(req, res){
	User.find({}, function(err, user){
		if (err)
			res.send(err);
		res.json(user);
	});
};

exports.create_a_user = function(req, res) {
	let salt1 = crypto.randomBytes(256).toString('hex');

	//hashing password with salt
	let hashedPassword = crypto.pbkdf2Sync(req.body.password, salt1, 100000, 256, 'sha512');

	//Set up the user information
	let info = {name:req.body.name, salt:salt1, hashedPW:hashedPassword.toString('hex'), challenge: "0"};
	console.log(hashedPassword.toString('hex'));

	//Add the user
	let new_user = new User(info);
	new_user.save(function(err, user){
		if(err)
			res.send(err);
		res.json(user);
	});
};


exports.read_a_user = function(req, res) {
	User.findById(req.params.userId, function(err, user){
		if(err)
			res.send(err);
		res.json(user);
	});
};

exports.update_a_user = function(req, res) {
	User.findOneAndUpdate({_id: req.body.userId}, req.body, {new: true}, function(err, user) {
		if(err)
			res.send(err);
		res.json(user);
	});
};

exports.delete_a_user = function(req, res) {
	User.remove({_id: req.params.userId}, function(err, user) {
		if(err)
			res.send(err);
		res.json({ message: 'User successfully deleted' });
        });
};


exports.login_part_one = function(req, res) {
	let query = User.findOne({name:req.body.name},  function(err,user) {
		if(err)
			res.send(err);

		//Update challenge
		user.challenge = crypto.randomBytes(256).toString('hex');
		user.save();

		res.json({salt:user.salt, challenge:user.challenge});
        });

};

exports.login_part_two = function(req, res) {
	let query = User.findOne({name:req.body.name},  function(err,user) {
		/*
		let hmacBuffer = new Buffer(user.hashedPW, 'binary');
		let hmac = crypto.createHmac('sha512', hmacBuffer);
		hmac.update(user.challenge);
		let HMACtag = hmac.digest('hex');

		console.log('challenge: ' +  user.challenge);
		console.log('HashedPW: ' + user.hashedPW);
		console.log('Salt: ' + user.salt);
		console.log('tag: ' + HMACtag);
		*/

		let privateKey = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAgsAhGpmnvQj5Auyjyx/Hg1MFRK8yA6/B/4wlCSrELgpdLlhFtzHHbXrZ\nmMvvrc/tVMsonmQ/Wjn0yhPIn1Muu0dSASDulwrUVTokSSrAsECXGwoUW69EPrbMKsPz8Cp0\ngq/8K1ZkNOLtA24uTNClCEy9wCyjxogC4A1kg0KT33j+p/kHOgepGXv3c2JBzZ41z84rCppv\nVWLPRSiiuOV/wY1X1gE+YtNk5DnraUSSqC6tWWE7zrarC8zT3saMhC9oRpTZIcOAwbv/Gejw\nVvTZb+EC82JG0BYxiQ8xlbPPvkdx6PtEuL8IsPXxjZhBMmfrOk0/TN8cKq9tDYFO6eFILwID\nAQABAoIBABHdpOhYlJX88uGWai8oMX/dSTwAYGomivCbOrhM8q+D1QWvJB+LGr/36GG7hA2Q\n+tH6TJuQASQYBT3ThDdZC2qlrSvgTxmubiMTJcAlqlyrBrq4Ht4ETePv4Gf7jIqFkpQE7gUR\n8fFUDKTKWmM+oz5GFit7LgnDrfjle5V/9Gq1jyfhMKTvstBxpXnfWYyRCSW7IdmPOBjwK0Az\nghP36xzNPhahvU40asaKMSrQvU/Tob3g4pK9qHx+GYZZaTcCWHgiBqEa1xB/UJJMd3uoOhtt\nzADF6aHlarbmTx27d/2RkB4CXpfkrnB0pKXZW9vFTEvwQEfVSbQMnqDzzlMsg8ECgYEA60Tf\nZovJM2BaUFR4iubfYSgnlUBWr9vQbJ3DN080kO4Wt6z9+Q6JUJNuA5eH9V0uK+xgB6Yhxvaq\n7JLHOgeaDkLXtxTN6T6lXXDp1zj4zYTPNRvpGpl69v9/7CpN/DJewBApYO2fZKVRtjk6P2P/\nWfqkiBkrY4aDT5ixXdRoRY8CgYEAjkWPOJ50NhVl+pwSz6G/UykkwNKq2AbmdJiflkBwjUPq\nflD7nHcWkMH5kWZAOiLAp1i/Ng5U7zoxilFfpUOByL+Z1ZquohRqcp3KBICIlr+XRCYIq3YR\nphLzLwF+Thl8h299dDzsD0XX1Dq5YXS5skn2o3lpEHO8bvFMQqTtw2ECgYEAz8NzkahyVteJ\nChV+mhOGQtNmGUzHAOgaaEDty2M75Z0MHMo9QnsO0kRPzAY+P3U5N/q3Vynj/EOK7/4yx9E8\nv8lRnFFYAdmbySfUqYabWUsmfR0XvrC5QXSicFlvov6MZAohsIJH12aTAVwKTz6smrZYJAQu\nJ+b7AQiz4UuZhYsCgYBEIVtsqbTNEYI8ePEpLTQKBvHqxPe7a9KAk3YY5dMAUz3AL9fOHdlY\niQuSbXzkWjAX84/duw9BYITI0B8VbTaBg/+PIvvt8gjnylgrv8GpLyapI+2S7n+VIA4EvJpX\nnCzeTq2tNF93EONCZrzPxq4GixTpRALkNghOuI7ke0bBAQKBgQDBk0OYt4q1UK+y8EM5rx37\n/qYWiYkiRsfq/l5Haq5ZAESHADuaBzVwEwYgxjeYpHWAv0n+L3/C5EZczRB7Ep8iKPSRMPFz\n9h2hsZS1d5sJWJ5jTy1VIfmcXRdoCEoE3uxtiJDeByIkE4pFrapqAHWbriZjE9VYWE9hhgd5\ne0yM/g==\n-----END RSA PRIVATE KEY-----'
		console.log(privateKey);

		if(req.body.hashedPW.toString('hex').valueOf() !== user.hashedPW.toString('hex').valueOf())
			res.json({message: 'Username or password was incorrect'});
		else{

			let myToken = jwt.sign({ username: req.body.name }, privateKey, {algorithm: 'RS256', expiresIn: "30 days"});
			res.json({token:myToken});
		}
	});
};

