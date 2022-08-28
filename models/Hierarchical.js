const { Schema, model } = require('mongoose')

const Hierarchical = new Schema({
  document: {type: Number, require: true},
  cluster: {type: Number, require: true},
  lambda: {type: Number, require: true},
})

module.exports = model('Hierarchical', Hierarchical)
