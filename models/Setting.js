const { Schema, model } = require('mongoose')

const Setting = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  hintAvailable: {type: Boolean, default: false},
  dateCreate: {type: Date, default: new Date()},
})

module.exports = model('Setting', Setting)