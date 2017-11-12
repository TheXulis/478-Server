'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var UserSchema = new Schema({
  name: {
    type: String,
    required: 'Please enter a username'
  },
  salt: {
    type: String
  },
  hashedPW: {
    type: String,
    required: 'Please enter a password'
  },
  challenge: {
    type: String
  }
});

module.exports = mongoose.model('Users', UserSchema);
