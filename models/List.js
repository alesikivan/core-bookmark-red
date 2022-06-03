const { Schema, model } = require('mongoose')

const List = new Schema({
  title: {type: String, require: true},
  owner: {type: Schema.Types.ObjectId, ref: 'User'},
  resources: {type: [Schema.Types.ObjectId], ref: 'Resource'},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('List', List)