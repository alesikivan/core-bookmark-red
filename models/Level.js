const { Schema, model } = require('mongoose')

const Level = new Schema({
  parent: {type: Number, require: true},
  child: {type: Number, require: true},
  lambda: {type: Number, require: true},
  documents: {type: Number, require: true},
})

module.exports = model('Level', Level)
