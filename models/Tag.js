const { Schema, model } = require('mongoose')

const Tag = new Schema({
  title: {type: String, require: true},
  rating: {type: Number, default: 0},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Tag', Tag)