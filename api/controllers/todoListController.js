'use strict';

let mongoose = require('mongoose');
let User = mongoose.model('Users');
let crypto = require('crypto');
let expressJWT = require('express-jwt');
let jwt = require('jsonwebtoken');
let fs = require('fs');

/*
exports.list_all_users = function(req, res){
	User.find({}, function(err, user){
		if (err)
			res.send(err);
		res.json(user);
	});
};
*/

exports.create_a_user = function(req, res) {

	let query = User.findOne({name:req.body.name}, function(err, user){

		if(user != null){
			console.log(user.name);
			console.log(user.id);
			res.json({message: "Failed", error:"User already exists."});
		} else{
			let salt1 = crypto.randomBytes(256).toString('hex');

			console.log(req.body.name);

			//hashing password with salt
			let hashedPassword = crypto.pbkdf2Sync(req.body.password, salt1, 100000, 256, 'sha512');

			//Set up the user information
			let info = {name:req.body.name, salt:salt1, hashedPW:hashedPassword.toString('hex'), challenge: "0"};
			console.log(hashedPassword.toString('hex'));

			//Add the user
			let new_user = new User(info);
			new_user.save(function(err, user){
				if(err)
					res.json({message: "Failed", error:err});
				res.json({message: "Worked"});
			});
		};
	});
};


/*
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
*/

exports.login_part_one = function(req, res) {
	let query = User.findOne({name:req.body.name},  function(err,user) {
		if(err)
			res.send(err);

		if(user == null){
			res.json({message:"Failed", error1:"User does not exist"});
		}else{
			//Update challenge
			user.challenge = crypto.randomBytes(256).toString('hex');
			user.save();

			console.log(req.body.name);

			res.json({message:"Worked", salt:user.salt, challenge:user.challenge});
		}
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

		console.log('Login part two for ' + req.body.name);

		let privateKey = fs.readFileSync('/home/blove/private_key.pem','utf8');

		if(req.body.hashedPW.toString('hex').valueOf() !== user.hashedPW.toString('hex').valueOf())
			res.json({message:'Failed', error2: 'Username/password combo was incorrect'});
		else{

			let myToken = jwt.sign({ username: req.body.name }, privateKey, {algorithm: 'RS256', expiresIn: "1 days"});
			res.json({message:'Worked', token:myToken});
		}
	});
};

