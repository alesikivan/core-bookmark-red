const { Schema, model } = require('mongoose');
const Group = require('./Group');

const User = new Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  email: {type: String, unique: true, required: true},
  roles: {type: [String], ref: 'Role', default: []},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
  profilePhoto: {type: String},
  followers: {type: [Schema.Types.ObjectId], ref: 'User', default: []},
  following: {type: [Schema.Types.ObjectId], ref: 'User', default: []},
  source: {type: String, default: 'bookmark.red'},
  resetPasswordToken: {type: String},
  resetPasswordExpire: {type: String},
})

module.exports = model('User', User)
