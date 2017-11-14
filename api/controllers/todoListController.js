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
		let hmacBuffer = new buffer(user.hashedPW, 'binary');
		let hmac = crypto.createHmac('sha512', hmacBuffer);
		hmac.update(user.challenge);
		let HMACtag = hmac.digest('hex');

		if(req.body.tag != HMACtag)
			res.json({message: 'Username or password was incorrect'});
		else{
			var myToken = jwt.sign({ username: req.body.name }, 'something');
			res.json({}).
		}
};

