const { Schema, model } = require('mongoose')

const Galaxy = new Schema({
  topic: {type: String, require: true},
  description: {type: String, require: true},
  keywords: {type: String, require: true},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Galaxy', Galaxy)
