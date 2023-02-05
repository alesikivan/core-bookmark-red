const { Schema, model } = require('mongoose')

const Feedback = new Schema({
  description: {type: String, require: true},
  topic: {type: String, require: true},
  author: {type: Schema.Types.ObjectId, ref: 'User'},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Feedback', Feedback)