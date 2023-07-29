const { Schema, model } = require('mongoose')

const Keyword = new Schema({
  title: { type: String, require: true },
  embedding: { type: [Number], default: [] },
  dateCreate: { type: Date, default: new Date() },
  dateUpdate: { type: Date, default: new Date() },
})

module.exports = model('Keyword', Keyword)