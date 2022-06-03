const { Schema, model } = require('mongoose')

const Feedback = new Schema({
  content: {type: String, require: true},
  owner: {type: Schema.Types.ObjectId, ref: 'User'},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Feedback', Feedback)