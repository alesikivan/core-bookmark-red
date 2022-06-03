const { Schema, model } = require('mongoose')

const Role = new Schema({
  value: {type: String, unique: true, default: 'USER'},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Role', Role)