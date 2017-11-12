'use strict';

let mongoose = require('mongoose');
let User = mongoose.model('Users');
let crypto = require('crypto');

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
	let info = {name:req.body.name, salt:salt1, hashedPW:hashedPassword.toString('hex')};
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
	User.findOneAndUpdate({_id: req.params.userId}, req.body, {new: true}, function(err, user) {
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



